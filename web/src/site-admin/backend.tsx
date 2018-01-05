import { Observable } from 'rxjs/Observable'
import { map } from 'rxjs/operators/map'
import { gql, mutateGraphQL, queryGraphQL } from '../backend/graphql'

/**
 * Fetches all users.
 */
export function fetchAllUsers(query?: string): Observable<GQL.IUserConnection> {
    return queryGraphQL(
        gql`
            query Users($query: String) {
                site {
                    users(first: 100, query: $query) {
                        nodes {
                            id
                            externalID
                            username
                            displayName
                            email
                            createdAt
                            siteAdmin
                            latestSettings {
                                createdAt
                                configuration {
                                    contents
                                }
                            }
                            orgs {
                                name
                            }
                            tags {
                                name
                            }
                        }
                        totalCount
                    }
                }
            }
        `,
        { query }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.users) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site.users
        })
    )
}

/**
 * Fetches all orgs.
 */
export function fetchAllOrgs(query?: string): Observable<GQL.IOrgConnection> {
    return queryGraphQL(
        gql`
            query Orgs($query: String) {
                site {
                    orgs(first: 100, query: $query) {
                        nodes {
                            id
                            name
                            displayName
                            createdAt
                            latestSettings {
                                createdAt
                                configuration {
                                    contents
                                }
                            }
                            members {
                                user {
                                    username
                                }
                            }
                            tags {
                                name
                            }
                        }
                        totalCount
                    }
                }
            }
        `,
        { query }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.orgs) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site.orgs
        })
    )
}

/**
 * Fetches all repositories.
 *
 * @return Observable that emits the list of repositories
 */
export function fetchAllRepositories(opt: {
    first?: number
    query?: string
    includeDisabled?: boolean
}): Observable<GQL.IRepositoryConnection> {
    opt = { includeDisabled: false, ...opt }
    return queryGraphQL(
        gql`
            query Repositories($first: Int, $query: String, $includeDisabled: Boolean) {
                site {
                    repositories(first: $first, query: $query, includeDisabled: $includeDisabled) {
                        nodes {
                            id
                            uri
                            enabled
                            createdAt
                        }
                        totalCount
                    }
                }
            }
        `,
        opt
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.repositories) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site.repositories
        })
    )
}

export function setRepositoryEnabled(repository: GQLID, enabled: boolean): Observable<void> {
    return mutateGraphQL(
        gql`
    mutation SetRepositoryEnabled($repository: ID!, $enabled: Boolean!) {
        setRepositoryEnabled(repository: $repository, enabled: $enabled) { }
    }`,
        { repository, enabled }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0)) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
        })
    )
}

/**
 * Fetches usage analytics for all users.
 *
 * @return Observable that emits the list of users and their usage data
 */
export function fetchUserAnalytics(): Observable<GQL.IUser[]> {
    return queryGraphQL(gql`
        query Users {
            site {
                users {
                    nodes {
                        id
                        username
                        activity {
                            searchQueries
                            pageViews
                        }
                    }
                }
            }
        }
    `).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.users) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site.users.nodes
        })
    )
}

/**
 * Fetches the site and its configuration.
 *
 * @return Observable that emits the site
 */
export function fetchSite(opt: { telemetrySamples?: boolean }): Observable<GQL.ISite> {
    return queryGraphQL(gql`
        query Site {
            site {
                id
                configuration {
                    effectiveContents
                    pendingContents
                    extraValidationErrors
                    canUpdate
                    source
                }
                ${opt && opt.telemetrySamples ? 'telemetrySamples' : ''}
            }
        }
    `).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site
        })
    )
}

/**
 * Updates the site's configuration.
 */
export function updateSiteConfiguration(input: string): Observable<void> {
    return mutateGraphQL(
        gql`
        mutation UpdateSiteConfiguration($input: String!) {
        updateSiteConfiguration(input: $input) {}
    }`,
        { input }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.updateSiteConfiguration) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.updateSiteConfiguration as any
        })
    )
}

/**
 * Reloads the site.
 */
export function reloadSite(): Observable<void> {
    return mutateGraphQL(gql`mutation ReloadSite() { reloadSite {} }`).pipe(
        map(({ data, errors }) => {
            if (!data || !data.reloadSite) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.reloadSite as any
        })
    )
}

export function updateDeploymentConfiguration(email: string, telemetryEnabled: boolean): Observable<void> {
    return queryGraphQL(
        gql`
            query UpdateDeploymentConfiguration($email: String, $enableTelemetry: Boolean) {
                updateDeploymentConfiguration(email: $email, enableTelemetry: $enableTelemetry) {
                    alwaysNil
                }
            }
        `,
        { email, enableTelemetry: telemetryEnabled }
    ).pipe(
        map(({ data, errors }) => {
            if (!data) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
        })
    )
}

export function setUserIsSiteAdmin(userID: GQLID, siteAdmin: boolean): Observable<void> {
    return mutateGraphQL(
        gql`
    mutation SetUserIsSiteAdmin($userID: ID!, $siteAdmin: Boolean!) {
        setUserIsSiteAdmin(userID: $userID, siteAdmin: $siteAdmin) { }
    }`,
        { userID, siteAdmin }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0)) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
        })
    )
}

export function randomizeUserPasswordBySiteAdmin(user: GQLID): Observable<GQL.IRandomizeUserPasswordBySiteAdminResult> {
    return mutateGraphQL(
        gql`
            mutation RandomizeUserPasswordBySiteAdmin($user: ID!) {
                randomizeUserPasswordBySiteAdmin(user: $user) {
                    resetPasswordURL
                }
            }
        `,
        { user }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0) || !data.randomizeUserPasswordBySiteAdmin) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.randomizeUserPasswordBySiteAdmin
        })
    )
}

export function deleteUser(user: GQLID): Observable<void> {
    return mutateGraphQL(
        gql`
            mutation DeleteUser($user: ID!) {
                deleteUser(user: $user) { }
            }
        `,
        { user }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0) || !data.deleteUser) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
        })
    )
}

export function createUserBySiteAdmin(username: string, email: string): Observable<GQL.ICreateUserBySiteAdminResult> {
    return mutateGraphQL(
        gql`
            mutation CreateUserBySiteAdmin($username: String!, $email: String!) {
                createUserBySiteAdmin(username: $username, email: $email) {
                    resetPasswordURL
                }
            }
        `,
        { username, email }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0) || !data.createUserBySiteAdmin) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.createUserBySiteAdmin
        })
    )
}

export function deleteOrganization(organization: GQLID): Observable<void> {
    return mutateGraphQL(
        gql`
            mutation DeleteOrganization($organization: ID!) {
                deleteOrganization(organization: $organization) { }
            }
        `,
        { organization }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || (errors && errors.length > 0) || !data.deleteOrganization) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
        })
    )
}

/**
 * Fetches all threads.
 */
export function fetchAllThreads(): Observable<GQL.IThreadConnection> {
    return queryGraphQL(gql`
        query SiteThreads {
            site {
                threads {
                    nodes {
                        id
                        repo {
                            canonicalRemoteID
                            org {
                                name
                            }
                        }
                        repoRevisionPath
                        branch
                        repoRevisionPath
                        repoRevision
                        title
                        createdAt
                        archivedAt
                        author {
                            id
                            username
                            displayName
                        }
                        comments {
                            id
                            title
                            contents
                            createdAt
                            author {
                                id
                                username
                                displayName
                            }
                        }
                    }
                    totalCount
                }
            }
        }
    `).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.threads) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return data.site.threads
        })
    )
}

export function fetchSiteUpdateCheck(): Observable<{ version: string; updateCheck: GQL.IUpdateCheck }> {
    return queryGraphQL(
        gql`
            query SiteUpdateCheck() {
                site {
                    version
                    updateCheck {
                        pending
                        checkedAt
                        errorMessage
                        updateVersionAvailable
                    }
                }
            }        `
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.site || !data.site.updateCheck) {
                throw Object.assign(new Error((errors || []).map(e => e.message).join('\n')), { errors })
            }
            return { version: data.site.version, updateCheck: data.site.updateCheck }
        })
    )
}
