import { NextObserver, Observable, Subscribable } from 'rxjs'
import { SettingsEdit } from '../api/client/services/settings'
import { MessageTransports } from '../api/protocol/jsonrpc2/connection'
import { GraphQLResult } from '../graphql/graphql'
import * as GQL from '../graphql/schema'
import { Settings, SettingsCascadeOrError } from '../settings/settings'

/**
 * Platform-specific data and methods shared by multiple Sourcegraph components.
 *
 * Whenever shared code (in shared/) needs to perform an action or retrieve data that requires different
 * implementations depending on the platform, the shared code should use this value's fields.
 */
export interface PlatformContext {
    /**
     * An observable that emits the settings cascade upon subscription and whenever it changes (including when it
     * changes as a result of a call to {@link PlatformContext#updateSettings}).
     *
     * It should be a cold observable so that it does not trigger a network request upon each subscription.
     */
    readonly settings: Subscribable<SettingsCascadeOrError<Settings>>

    /**
     * Update the settings for the subject, either by inserting/changing a specific value or by overwriting the
     * entire settings with a new stringified JSON value.
     *
     * This function must ensure that {@link PlatformContext#settings} reflects the updated settings before its
     * returned promise resolves.
     *
     * @todo To make updating settings feel more responsive, make this return an observable that emits twice (by
     * convention): once immediately with the optimistic new value, and once when it is acked by the server (then
     * completes).
     *
     * @param subject The settings subject whose settings to update.
     * @param edit An edit to a specific value, or a stringified JSON value to overwrite the current settings with.
     * @returns A promise that resolves after the update succeeds and {@link PlatformContext#settings} reflects the
     * update.
     */
    updateSettings(subject: GQL.ID, edit: SettingsEdit | string): Promise<void>

    /**
     * Sends a request to the Sourcegraph GraphQL API and returns the response.
     *
     * @template R The GraphQL result type
     * @param request The GraphQL request (query or mutation)
     * @param variables An object whose properties are GraphQL query name-value variable pairs
     * @param mightContainPrivateInfo 🚨 SECURITY: Whether or not sending the GraphQL request to Sourcegraph.com
     * could leak private information such as repository names.
     * @return Observable that emits the result or an error if the HTTP request failed
     */
    queryGraphQL<R extends GQL.IQuery | GQL.IMutation>(
        request: string,
        variables?: { [name: string]: any },
        mightContainPrivateInfo?: boolean
    ): Subscribable<GraphQLResult<R>>

    /**
     * Sends a batch of LSP requests to the Sourcegraph LSP gateway API and returns the result.
     *
     * @param requests An array of LSP requests (with methods `initialize`, the (optional) request, `shutdown`,
     *                 `exit`).
     * @return Observable that emits the result and then completes, or an error if the request fails. The value is
     *         an array of LSP responses.
     */
    queryLSP(requests: object[]): Subscribable<object[]>

    /**
     * Forces the currently displayed tooltip, if any, to update its contents.
     */
    forceUpdateTooltip(): void

    /**
     * Spawns a new JavaScript execution context (such as a Web Worker or browser extension
     * background worker) with the extension host and opens a communication channel to it. It is
     * called exactly once, to start the extension host.
     *
     * @returns An observable that emits at most once with the message transports for communicating
     * with the execution context (using, e.g., postMessage/onmessage) when it is ready.
     */
    createExtensionHost(): Observable<MessageTransports>

    /**
     * Returns the script URL suitable for passing to importScripts for an extension's bundle.
     *
     * This is necessary because some platforms (such as Chrome extensions) use a script-src CSP
     * that would prevent loading bundles from arbitrary URLs, which requires us to pass blob: URIs
     * to importScripts.
     *
     * @param bundleURL The URL to the JavaScript bundle file specified in the extension manifest.
     * @return A script URL suitable for passing to importScripts, typically either the original
     * https:// URL for the extension's bundle or a blob: URI for it.
     */
    getScriptURLForExtension(bundleURL: string): string | Promise<string>

    /**
     * The URL to the Sourcegraph site that the user's session is associated with. This refers to
     * Sourcegraph.com (`https://sourcegraph.com`) by default, or a self-hosted instance of
     * Sourcegraph.
     *
     * This is available to extensions in `sourcegraph.internal.sourcegraphURL`.
     *
     * @todo Consider removing this when https://github.com/sourcegraph/sourcegraph/issues/566 is
     * fixed.
     *
     * @example `https://sourcegraph.com`
     */
    sourcegraphURL: string

    /**
     * The client application that is running this extension, either 'sourcegraph' for Sourcegraph
     * or 'other' for all other applications (such as GitHub, GitLab, etc.).
     *
     * This is available to extensions in `sourcegraph.internal.clientApplication`.
     *
     * @todo Consider removing this when https://github.com/sourcegraph/sourcegraph/issues/566 is
     * fixed.
     */
    clientApplication: 'sourcegraph' | 'other'

    /**
     * Whether to log all messages sent between the client and the extension host.
     */
    traceExtensionHostCommunication: Subscribable<boolean> & NextObserver<boolean>
}

/**
 * React partial props for components needing the {@link PlatformContext}.
 */
export interface PlatformContextProps {
    platformContext: PlatformContext
}