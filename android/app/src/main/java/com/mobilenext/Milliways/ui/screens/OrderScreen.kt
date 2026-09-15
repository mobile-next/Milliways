package com.mobilenext.Milliways.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mobilenext.Milliways.model.OrderManager
import com.mobilenext.Milliways.model.formatPrice
import com.mobilenext.Milliways.ui.theme.MilliwaysBlue
import com.mobilenext.Milliways.ui.theme.MilliwaysGreen
import com.mobilenext.Milliways.ui.theme.MilliwaysGroupedBackground
import com.mobilenext.Milliways.ui.theme.MilliwaysRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreen(
    orderManager: OrderManager,
    onBack: () -> Unit,
    onPlaceOrder: () -> Unit
) {
    var couponCode by remember { mutableStateOf("") }
    var couponError by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MilliwaysGroupedBackground)
            .imePadding()
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(4.dp)
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MilliwaysBlue)
            }
            Text(
                "Your Order",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Box(modifier = Modifier.size(48.dp))
        }

        if (orderManager.items.isEmpty()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.weight(1f).fillMaxWidth()
            ) {
                Icon(
                    Icons.Filled.ShoppingCart,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(80.dp)
                )
                Text(
                    "Your order is empty",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 20.dp)
                )
            }

            // Deliberately left enabled with an empty cart — placing an order here
            // crashes on the delivery screen (see DeliveryScreen), mirroring the iOS app.
            Button(
                onClick = onPlaceOrder,
                colors = ButtonDefaults.buttonColors(containerColor = MilliwaysGreen),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 40.dp).height(56.dp)
            ) {
                Text("Place Order", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
        } else {
            LazyColumn(modifier = Modifier.weight(1f)) {
                items(orderManager.items, key = { it.id }) { orderItem ->
                    val dismissState = rememberSwipeToDismissBoxState(
                        confirmValueChange = { value ->
                            if (value == SwipeToDismissBoxValue.EndToStart) {
                                orderManager.removeItem(orderItem.id)
                                true
                            } else {
                                false
                            }
                        }
                    )
                    SwipeToDismissBox(
                        state = dismissState,
                        enableDismissFromStartToEnd = false,
                        backgroundContent = {
                            Row(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(MilliwaysRed)
                                    .padding(horizontal = 20.dp),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = Color.White)
                            }
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.background)
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            if (orderItem.menuItem.imageRes != null) {
                                Image(
                                    painter = painterResource(orderItem.menuItem.imageRes),
                                    contentDescription = orderItem.menuItem.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.size(50.dp).clip(RoundedCornerShape(8.dp))
                                )
                            } else {
                                Box(modifier = Modifier.size(50.dp).clip(RoundedCornerShape(8.dp)).background(orderItem.menuItem.color))
                            }
                            Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
                                Text(orderItem.menuItem.name, fontWeight = FontWeight.SemiBold)
                                Text(
                                    "${orderItem.quantity} × ${formatPrice(orderItem.menuItem.price)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text(formatPrice(orderItem.totalPrice), fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (orderManager.couponDiscount > 0) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                "Coupon ${orderManager.appliedCouponCode ?: ""}",
                                color = MilliwaysGreen,
                                modifier = Modifier.weight(1f)
                            )
                            Text("-${formatPrice(orderManager.couponDiscount)}", color = MilliwaysGreen)
                        }
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Text("Total", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Text(
                            formatPrice(orderManager.finalTotal),
                            fontWeight = FontWeight.Bold,
                            color = if (orderManager.finalTotal < 0) MilliwaysRed else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            if (orderManager.appliedCouponCode == null) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = couponCode,
                            onValueChange = { couponCode = it.uppercase() },
                            label = { Text("Coupon code") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = {
                                if (orderManager.applyCoupon(couponCode)) {
                                    couponCode = ""
                                    couponError = null
                                } else {
                                    couponError = "Invalid coupon code"
                                }
                            },
                            modifier = Modifier.padding(start = 8.dp)
                        ) {
                            Text("Apply")
                        }
                    }
                    couponError?.let {
                        Text(it, color = MilliwaysRed, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            Button(
                onClick = {
                    // Coupon discount is frozen at apply-time and can drive the total negative;
                    // placing an order in that state crashes, mirroring the iOS app's UInt trap.
                    check(orderManager.finalTotal >= 0.0) {
                        "Negative total: ${orderManager.finalTotal}"
                    }
                    val cents = (orderManager.finalTotal * 100).toUInt()
                    println("Processing payment of $cents cents")
                    onPlaceOrder()
                },
                colors = ButtonDefaults.buttonColors(containerColor = MilliwaysGreen),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 40.dp).height(56.dp)
            ) {
                Text("Place Order", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
