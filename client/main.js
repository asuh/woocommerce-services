/**
 * External dependencies
 */
import 'react-hot-loader/patch';
import { AppContainer } from 'react-hot-loader';
import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactModal from 'react-modal';
import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import '../assets/stylesheets/style.scss';
import './lib/calypso-boot';
import * as storageUtils from 'lib/utils/local-storage';
import { setNonce, setBaseURL } from 'api/request';
import wpcomApiMiddleware from 'state/data-layer/wpcom-api-middleware';
import localApiMiddleware from 'lib/local-api-middleware';

// Modify webpack pubilcPath at runtime based on location of WordPress Plugin.
// eslint-disable-next-line no-undef
__webpack_public_path__ = global.wcsPluginData.assetPath;

if ( global.wcConnectData ) {
	setNonce( global.wcConnectData.nonce );
	setBaseURL( global.wcConnectData.baseURL );
}

const classNamesToRoutes = {
	'wc-connect-create-shipping-label': './apps/shipping-label',
	'wc-connect-service-settings': './apps/settings',
	'wc-connect-admin-status': './apps/plugin-status',
	'wc-connect-shipping-settings': './apps/shipping-settings',
	'wc-connect-admin-test-print': './apps/print-test-label',
	'wc-connect-stripe-connect-account': './apps/stripe-connect-account',
};

const getRouteClass = async ( className ) => {
	let module = null;
	switch ( className) {
		case 'wc-connect-create-shipping-label':
			module = await import(/* webpackChunkName: "shipping-label" */ './apps/shipping-label');
			break;
		case 'wc-connect-service-settings':
			module = await import(/* webpackChunkName: "settings" */ './apps/settings');
			break;
		case 'wc-connect-admin-status':
			module = await import(/* webpackChunkName: "plugin-status" */ './apps/plugin-status');
			break;
		case 'wc-connect-shipping-settings':
			module = await import(/* webpackChunkName: "shipping-settings" */ './apps/shipping-settings');
			break;
		case 'wc-connect-admin-test-print':
			module = await import(/* webpackChunkName: "print-test-label" */ './apps/print-test-label');
			break;
		case 'wc-connect-stripe-connect-account':
			module = await import(/* webpackChunkName: "shipping-label" */ './apps/stripe-connect-account');
			break;
		default:
			return null;
	}
	return module.default;
};

const createdStores = {};

Array.from( document.getElementsByClassName( 'wcc-root' ) ).forEach( ( container ) => {
	const args = container.dataset.args && JSON.parse( container.dataset.args ) || {};
	let routeClassName;

	for ( const className of container.classList ) {
		if ( classNamesToRoutes.hasOwnProperty( className ) ) {
			routeClassName = className;
			break;
		}
	}

	getRouteClass( routeClassName ).then( RouteClass => {
		if ( ! RouteClass ) {
			return;
		}
		const Route = RouteClass( args );

		if( typeof createdStores[ routeClassName ] === 'undefined' || routeClassName !== 'wc-connect-create-shipping-label' ) {
			const persistedStateKey = Route.getStateKey();
			const persistedState = storageUtils.getWithExpiry( persistedStateKey );
			storageUtils.remove( persistedStateKey );
			const serverState = Route.getInitialState();
			const initialState = { ...serverState, ...persistedState };

			const middlewares = [
				thunk.withExtraArgument( args ),
				wpcomApiMiddleware,
				localApiMiddleware,
			];

			if ( Route.getMiddlewares ) {
				middlewares.push.apply( middlewares, Route.getMiddlewares() );
			}

			const enhancers = [
				applyMiddleware( ...middlewares ),
				window.devToolsExtension && window.devToolsExtension(),
			].filter( Boolean );

			const store = compose( ...enhancers )( createStore )( Route.getReducer(), initialState );

			if ( Route.getInitialActions ) {
				Route.getInitialActions().forEach( store.dispatch );
			}

			window.addEventListener( 'beforeunload', () => {
				const state = store.getState();

				if ( window.persistState ) {
					storageUtils.setWithExpiry( persistedStateKey, Route.getStateForPersisting( state ) );
				}
			} );

			createdStores[ routeClassName ] = store;
		}

		ReactModal.setAppElement( container );
		ReactDOM.render(
			<AppContainer>
				<Provider store={ createdStores[ routeClassName ] }>
					<Route.View />
				</Provider>
			</AppContainer>,
			container
		);
	});
} );

window.wcsGetAppStore = function( storeKey ) {
	return createdStores[ storeKey ];
};

if ( module.hot ) {
    for ( const className in classNamesToRoutes ) {
	    module.hot.accept( './client' + classNamesToRoutes[ className ].substring( 1 ) + '/index.js', () => {
		    Array.from( document.getElementsByClassName( className ) ).forEach( ( container ) => {

			    const args = container.dataset.args && JSON.parse( container.dataset.args ) || {};

			    let module = null;
			    // We have to use a switch because react or webpack cannot find the module if we use dynamic imports.
			    switch ( className) {
				    case 'wc-connect-create-shipping-label':
					    module = require( './apps/shipping-label' );
					    break;
				    case 'wc-connect-service-settings':
					    module = require( './apps/settings') ;
					    break;
				    case 'wc-connect-admin-status':
					    module = require( './apps/plugin-status' );
					    break;
				    case 'wc-connect-shipping-settings':
					    module = require( './apps/shipping-settings' );
					    break;
				    case 'wc-connect-admin-test-print':
					    module = require( './apps/print-test-label' );
					    break;
				    case 'wc-connect-stripe-connect-account':
					    module = require( './apps/stripe-connect-account' );
					    break;
				    default:
				    	return;
			    }
			    const NextApp = module.default( args );
			    ReactDOM.render(
				    <AppContainer>
					    <Provider store={ createdStores[ 'wc-connect-create-shipping-label' ] }>
						    <NextApp.View/>
					    </Provider>
				    </AppContainer>,
				    container
			    );
		    });
	    });
    }
}
