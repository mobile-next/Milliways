package com.mobilenext.Milliways

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.remember
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mobilenext.Milliways.model.OrderManager
import com.mobilenext.Milliways.ui.screens.DeliveryScreen
import com.mobilenext.Milliways.ui.screens.MenuScreen
import com.mobilenext.Milliways.ui.screens.OrderScreen
import com.mobilenext.Milliways.ui.screens.WelcomeScreen
import com.mobilenext.Milliways.ui.theme.MilliwaysTheme

private const val ROUTE_WELCOME = "welcome"
private const val ROUTE_MENU = "menu"
private const val ROUTE_ORDER = "order"
private const val ROUTE_DELIVERY = "delivery"

private const val TRANSITION_MS = 350

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val openAccount = intent.data?.host == "account"
        setContent {
            MilliwaysTheme {
                val navController = rememberNavController()
                val orderManager = remember { OrderManager() }

                NavHost(
                    navController = navController,
                    startDestination = ROUTE_WELCOME,
                    // iOS-style push: new screen slides in from the right, current
                    // screen slides out partway to the left (and reverses on pop).
                    enterTransition = {
                        slideInHorizontally(tween(TRANSITION_MS)) { it }
                    },
                    exitTransition = {
                        slideOutHorizontally(tween(TRANSITION_MS)) { -it / 3 }
                    },
                    popEnterTransition = {
                        slideInHorizontally(tween(TRANSITION_MS)) { -it / 3 }
                    },
                    popExitTransition = {
                        slideOutHorizontally(tween(TRANSITION_MS)) { it }
                    }
                ) {
                    composable(
                        ROUTE_WELCOME,
                        // Closing Delivery pops straight back to Welcome (skipping Menu/Order) —
                        // let the cover's own slide-down read as the transition, Welcome just stays put.
                        popEnterTransition = {
                            if (initialState.destination.route == ROUTE_DELIVERY) {
                                EnterTransition.None
                            } else {
                                slideInHorizontally(tween(TRANSITION_MS)) { -it / 3 }
                            }
                        }
                    ) {
                        WelcomeScreen(
                            orderManager = orderManager,
                            openAccount = openAccount,
                            onNewOrder = { navController.navigate(ROUTE_MENU) }
                        )
                    }
                    composable(ROUTE_MENU) {
                        MenuScreen(
                            orderManager = orderManager,
                            onBack = { navController.popBackStack() },
                            onViewOrder = { navController.navigate(ROUTE_ORDER) }
                        )
                    }
                    composable(
                        ROUTE_ORDER,
                        // Order stays static underneath while Delivery slides up as a cover.
                        exitTransition = { ExitTransition.None }
                    ) {
                        OrderScreen(
                            orderManager = orderManager,
                            onBack = { navController.popBackStack() },
                            onPlaceOrder = { navController.navigate(ROUTE_DELIVERY) }
                        )
                    }
                    composable(
                        ROUTE_DELIVERY,
                        // iOS fullScreenCover: slides up from the bottom over the
                        // current screen, and slides back down on close.
                        enterTransition = {
                            slideInVertically(tween(TRANSITION_MS)) { it }
                        },
                        exitTransition = { ExitTransition.None },
                        popExitTransition = {
                            slideOutVertically(tween(TRANSITION_MS)) { it }
                        }
                    ) {
                        DeliveryScreen(
                            orderManager = orderManager,
                            onClose = {
                                orderManager.clearOrder()
                                navController.popBackStack(ROUTE_WELCOME, inclusive = false)
                            }
                        )
                    }
                }
            }
        }
    }
}
