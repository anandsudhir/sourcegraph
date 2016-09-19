// tslint:disable: typedef ordered-imports

import * as React from "react";
import {Link} from "react-router";
import {EventListener} from "sourcegraph/Component";
import {LocationStateToggleLink} from "sourcegraph/components/LocationStateToggleLink";
import {LocationStateModal, dismissModal} from "sourcegraph/components/Modal";
import {Avatar, Popover, Menu, Logo, Heading} from "sourcegraph/components";
import {CloseIcon} from "sourcegraph/components/Icons";
import * as styles from "sourcegraph/app/styles/GlobalNav.css";
import * as base from "sourcegraph/components/styles/_base.css";
import * as colors from "sourcegraph/components/styles/_colors.css";
import * as typography from "sourcegraph/components/styles/_typography.css";
import * as classNames from "classnames";

import {SignupForm} from "sourcegraph/user/Signup";
import {LoginForm} from "sourcegraph/user/Login";
import {BetaInterestForm} from "sourcegraph/home/BetaInterestForm";
import {Integrations} from "sourcegraph/home/Integrations";
import {EllipsisHorizontal, CheckIcon} from "sourcegraph/components/Icons";
import {DownPointer} from "sourcegraph/components/symbols";
import * as AnalyticsConstants from "sourcegraph/util/constants/AnalyticsConstants";
import {GlobalSearchInput} from "sourcegraph/search/GlobalSearchInput";
import {locationForSearch, queryFromStateOrURL, langsFromStateOrURL, scopeFromStateOrURL} from "sourcegraph/search/routes";
import {SearchResultsPanel} from "sourcegraph/search/SearchResultsPanel";
import * as invariant from "invariant";
import {rel, abs} from "sourcegraph/app/routePatterns";
import {repoPath, repoParam} from "sourcegraph/repo";
import {isPage} from "sourcegraph/page";
import * as debounce from "lodash/debounce";
import {context} from "sourcegraph/app/context";
import {InjectedRouter} from "react-router";
import {EventLogger} from "sourcegraph/util/EventLogger";

const hiddenNavRoutes = new Set([
	"/",
	`/${abs.integrations}`,
	"/styleguide",
	"login",
	"join",
]);

interface GlobalNavProps {
	navContext?: JSX.Element;
	location: any;
	params: any;
	channelStatusCode?: number;
	role?: string;
	desktop: boolean;
}

export function GlobalNav({navContext, location, params, channelStatusCode}: GlobalNavProps, {router, desktop}) {
	const dash = location.pathname.match(/^\/?$/) && context.user;
	const shouldHide = hiddenNavRoutes.has(location.pathname) && !dash;
	const isStaticPage = isPage(location.pathname);

	const showLogoMarkOnly = !isStaticPage || context.user;

	if (location.pathname === "/styleguide") {
		return <span />;
	}
	const repoSplat = repoParam(params.splat);
	const showSearchForm = !dash || desktop;
	const handleIntercomToggle = function() {
		global.window.Intercom("show");
		EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "ClickContactIntercom", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV});
	};
	let repo = repoSplat ? repoPath(repoSplat) : null;
	return (
		<nav
			id="global-nav"
			className={classNames(styles.navbar, colors.shadow_gray)}
			role="navigation"
			style={shouldHide ? {display: "none"} : {}}>

			{location.state && location.state.modal === "login" && !context.user &&
			// TODO(chexee): Decouple existence of modals and GlobalNav
				<LocationStateModal modalName="login" location={location} style={{maxWidth: "380px", marginLeft: "auto", marginRight: "auto"}}
					onDismiss={(v) => EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "DismissLoginModal", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
					<div className={styles.modal}>
						<LoginForm
							returnTo={location}
							location={location} />
					</div>
				</LocationStateModal>
			}

			{location.state && location.state.modal === "join" &&
				<LocationStateModal modalName="join" location={location} style={{maxWidth: "380px", marginLeft: "auto", marginRight: "auto"}}
					onDismiss={(v) => EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "DismissJoinModal", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
					<div className={styles.modal}>
						<SignupForm
							onSignupSuccess={dismissModal("join", location, router)}
							returnTo={shouldHide ? "/?ob=chrome" : location}
							location={location} />
					</div>
				</LocationStateModal>
			}

			{location.state && location.state.modal === "demo_video" &&
				// TODO(mate, chexee): consider moving this to Home.tsx
				<LocationStateModal modalName="demo_video" location={location} style={{maxWidth: "860px", marginRight: "auto", marginLeft: "auto"}}>
					<div className={styles.video_modal}>
						<iframe width="100%" style={{minHeight: "500px"}} src="https://www.youtube.com/embed/tf93F2nc3Yo?rel=0&amp;showinfo=0" frameBorder="0" allowFullScreen={true}></iframe>
					</div>
				</LocationStateModal>
			}

			{location.state && location.state.modal === "menuIntegrations" &&
				<div>
					<LocationStateModal modalName="menuIntegrations" location={location} style={{maxWidth: "380px", marginLeft: "auto", marginRight: "auto"}}>
						<div className={styles.modal}>
							<a className={styles.modal_dismiss} onClick={dismissModal("menuIntegrations", location, router)} color="white">
								<CloseIcon className={base.pt2} />
							</a>
							<Integrations location={location}/>
						</div>
					</LocationStateModal>
				</div>
			}

			{location.state && location.state.modal === "menuBeta" &&
				<LocationStateModal modalName="menuBeta" location={location} style={{maxWidth: "380px", marginLeft: "auto", marginRight: "auto"}}>
					<div className={styles.modal}>
						<Heading level="4" className={base.mb3} align="center">Join our beta program</Heading>
						<BetaInterestForm
							loginReturnTo="/beta"
							onSubmit={dismissModal("menuBeta", location, router)} />
					</div>
				</LocationStateModal>
			}

			<div className={classNames(styles.flex, styles.flex_fill, styles.flex_center, styles.tl, base.bn)}>
				<Link to="/" className={classNames(styles.logo_link, styles.flex_fixed)}>
					{showLogoMarkOnly ?
						<Logo className={classNames(styles.logo, styles.logomark)}
							width="21px"
							type="logomark"/> :
						<span>
							<Logo className={classNames(styles.logo, styles.logomark, styles.small_only)}
								width="21px"
								type="logomark"/>
							<Logo className={classNames(styles.logo, styles.not_small_only)}
								width="144px"
								type="logotype"/>
						</span>
					}
				</Link>

				<div
					className={classNames(styles.flex_fill, base.b__dotted, base.bn, base.brw2, base.pr3, colors.b__cool_pale_gray)}>
					{showSearchForm && <StyledSearchForm repo={repo} location={location} router={router} showResultsPanel={location.pathname !== `/${rel.search}`} />}
				</div>

				{typeof channelStatusCode !== "undefined" && channelStatusCode === 0 && <EllipsisHorizontal className={styles.icon_ellipsis} title="Your editor could not identify the symbol"/>}
				{typeof channelStatusCode !== "undefined" && channelStatusCode === 1 && <CheckIcon className={styles.icon_check} title="Sourcegraph successfully looked up symbol" />}

				{context.user && <div className={classNames(styles.flex, styles.flex_fixed, base.pv2, base.ph3)}>
					<Popover left={true}>
						<div className={styles.user}>
							{context.user.AvatarURL ? <Avatar size="small" img={context.user.AvatarURL} /> : <div>{context.user.Login}</div>}
							<DownPointer width={10} className={classNames(base.ml2, styles.fill_cool_mid_gray)} />
						</div>
						<Menu className={base.pa0} style={{width: "220px"}}>
							<div className={classNames(base.pa0, base.mb2, base.mt3)}>
								<Heading level="7" color="cool_mid_gray">Signed in as</Heading>
							</div>
							<div>{context.user.Login}</div>
							<hr role="divider" className={base.mv3} />
							<Link to="/settings/repos" role="menu_item">Your repositories</Link>
							<LocationStateToggleLink href="/integrations" modalName="menuIntegrations" role="menu_item" location={location}	onToggle={(v) => v && EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "ClickToolsandIntegrations", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
								Tools and integrations
							</LocationStateToggleLink>
							<LocationStateToggleLink href="/beta" modalName="menuBeta" role="menu_item" location={location}	onToggle={(v) => v && EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "ClickJoinBeta", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
								Beta program
							</LocationStateToggleLink>
							<a onClick={handleIntercomToggle} role="menu_item">
								Contact
							</a>
							<hr role="divider" className={base.mt3} />
							<a role="menu_item" href="/-/logout" onClick={(e) => { EventLogger.logout(); }}>Sign out</a>
							<hr role="divider" className={base.mt2} />
							<div className={classNames(styles.cool_mid_gray, base.pv1, base.mb1, typography.tc)}>
								<Link to="/security" className={classNames(styles.cool_mid_gray, typography.f7, typography.link_subtle, base.pr3)}>Security</Link>
								<Link to="/-/privacy" className={classNames(styles.cool_mid_gray, typography.f7, typography.link_subtle, base.pr3)}>Privacy</Link>
								<Link to="/-/terms" className={classNames(typography.f7, typography.link_subtle)}>Terms</Link>
							</div>
						</Menu>
					</Popover>
				</div>}

				{!context.user &&
					<div className={classNames(base.pv2, base.pr3, base.pl3)}>
						<div>
							<LocationStateToggleLink href="/login" modalName="login" location={location}
								onToggle={(v) => v && EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "ShowLoginModal", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
								Log in
							</LocationStateToggleLink>
							<span className={base.mh1}> or </span>
							<LocationStateToggleLink href="/join" modalName="join" location={location}
								onToggle={(v) => v && EventLogger.logEventForCategory(AnalyticsConstants.CATEGORY_AUTH, AnalyticsConstants.ACTION_CLICK, "ShowSignUpModal", {page_name: location.pathname, location_on_page: AnalyticsConstants.PAGE_LOCATION_GLOBAL_NAV})}>
								Sign up
							</LocationStateToggleLink>
						</div>
					</div>
				}
			</div>
		</nav>
	);
}

(GlobalNav as any).contextTypes = {
	siteConfig: React.PropTypes.object.isRequired,
	router: React.PropTypes.object.isRequired,
};

// TODO(chexee): Move all these components to their own directory.

interface SearchFormProps {
	repo: string | null;
	location: any;
	router: InjectedRouter;
	showResultsPanel: boolean;
}

interface SearchFormState {
	open: boolean;
	focused: boolean;
	query: string | null;
	lang: string[] | null;
	scope: any;
}

class SearchForm extends React.Component<SearchFormProps, SearchFormState> {
	_container: HTMLElement;
	_input: HTMLInputElement;

	_goToDebounced = debounce((routerFunc: any, loc: Location) => {
		routerFunc(loc);
	}, 200, {leading: false, trailing: true});

	state: SearchFormState = {
		open: false,
		focused: false,
		query: null,
		lang: null,
		scope: null,
	};

	constructor(props: SearchFormProps) {
		super(props);

		this.state.query = queryFromStateOrURL(props.location); // eslint-disable-line react/no-direct-mutation-state
		this.state.lang = langsFromStateOrURL(props.location); // eslint-disable-line react/no-direct-mutation-state
		this.state.scope = scopeFromStateOrURL(props.location); // eslint-disable-line react/no-direct-mutation-state

		this._handleGlobalHotkey = this._handleGlobalHotkey.bind(this);
		this._handleGlobalClick = this._handleGlobalClick.bind(this);
		this._handleSubmit = this._handleSubmit.bind(this);
		this._handleReset = this._handleReset.bind(this);
		this._handleKeyDown = this._handleKeyDown.bind(this);
		this._handleChange = this._handleChange.bind(this);
		this._handleFocus = this._handleFocus.bind(this);
		this._handleBlur = this._handleBlur.bind(this);
	}

	componentWillReceiveProps(nextProps: SearchFormProps) {
		const nextQuery = queryFromStateOrURL(nextProps.location);
		if (this.state.query !== nextQuery) {
			if (nextQuery && !this.state.query) {
				this.setState({open: true} as SearchFormState);
			} else {
				this.setState({query: nextQuery} as SearchFormState);
			}
		}

		if (!nextQuery) {
			this.setState({open: false} as SearchFormState);
		}
	}

	_handleGlobalHotkey(ev: KeyboardEvent) {
		if (ev.keyCode === 27 /* ESC */) {
			// Check that the element exists on the page before trying to set state.
			if (document.getElementById("e2etest-search-input")) {
				this.setState({open: false} as SearchFormState);
			}
		}
		// Hotkey "/" to focus search field.
		invariant(this._input, "input not available");
		if (ev.keyCode === 191 /* forward slash "/" */) {
			if (!document.activeElement || (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "TEXTAREA")) {
				ev.preventDefault();
				this._input.focus();
			}
		}
	}

	_handleGlobalClick(ev: Event) {
		// Clicking outside of the open results panel should close it.
		invariant(ev.target instanceof Node, "target is not a node");
		if (this.state.open && (!this._container || !this._container.contains(ev.target as Node))) {
			this.setState({open: false} as SearchFormState);
		}
	}

	_handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
		ev.preventDefault();
		this.props.router.push(locationForSearch(this.props.location, this.state.query, this.state.lang, this.state.scope, false, true));
	}

	_handleReset(ev: React.MouseEvent<HTMLButtonElement>) {
		this.setState({focused: false, open: false, query: ""} as SearchFormState);
		this._input.value = "";
	}

	_handleKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
		if (ev.keyCode === 27 /* ESC */) {
			this.setState({open: false} as SearchFormState);
			this._input.blur();
		} else if (ev.keyCode === 13 /* Enter */) {
			// Close the search results menu AFTER the action has taken place on
			// the result (if a result was highlighted).
			setTimeout(() => this.setState({open: false} as SearchFormState));
		}
	}

	_handleChange(ev: React.KeyboardEvent<HTMLInputElement>) {
		invariant(ev.currentTarget instanceof HTMLInputElement, "invalid currentTarget");
		const value = (ev.currentTarget as HTMLInputElement).value;
		this.setState({query: value} as SearchFormState);
		if (value) {
			this.setState({open: true} as SearchFormState);
		}
		this._goToDebounced(this.props.router.replace, locationForSearch(this.props.location, value, this.state.lang, this.state.scope, false, this.props.location.pathname.slice(1) === rel.search) as any);
	}

	_handleFocus(ev: React.FocusEvent<HTMLInputElement>) {
		const update: {focused: boolean; open: boolean; query?: string} = {focused: true, open: true};
		if (this._input && this._input.value) {
			update.query = this._input.value;
		}
		this.setState(update as SearchFormState);
	}

	_handleBlur(ev: React.FocusEvent<HTMLInputElement>) {
		this.setState({focused: false} as SearchFormState);
	}

	render(): JSX.Element | null {
		return (
			<div
				ref={e => this._container = e}>
				<form
					onSubmit={this._handleSubmit}
					className={styles.flex}
					autoComplete="off">
					<GlobalSearchInput
						name="q"
						showIcon={true}
						autoComplete="off"
						query={this.state.query || ""}
						domRef={e => this._input = e}
						autoFocus={this.props.location.pathname.slice(1) === rel.search}
						onFocus={this._handleFocus}
						onBlur={this._handleBlur}
						onKeyDown={this._handleKeyDown}
						onClick={this._handleFocus}
						onChange={this._handleChange} />
						{this.props.showResultsPanel && this.state.open && <button className={styles.close_button} type="reset" onClick={this._handleReset}><CloseIcon className={styles.close_icon} /></button>}
				</form>
				{this.props.showResultsPanel && this.state.open && <SearchResultsPanel query={this.state.query || ""} repo={this.props.repo} location={this.props.location} />}
				<EventListener target={global.document} event="keydown" callback={this._handleGlobalHotkey} />
				<EventListener target={global.document} event="click" callback={this._handleGlobalClick} />
			</div>
		);
	}
}
let StyledSearchForm = SearchForm;
