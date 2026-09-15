package com.mobilenext.Milliways.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mobilenext.Milliways.model.MenuItem
import com.mobilenext.Milliways.model.OrderManager
import com.mobilenext.Milliways.model.formatPrice
import com.mobilenext.Milliways.ui.theme.MilliwaysBlue
import com.mobilenext.Milliways.ui.theme.MilliwaysOrange
import com.mobilenext.Milliways.ui.theme.MilliwaysRed

@Composable
fun MenuScreen(
    orderManager: OrderManager,
    onBack: () -> Unit,
    onViewOrder: () -> Unit
) {
    var selectedItem by remember { mutableStateOf<MenuItem?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top bar
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 4.dp, vertical = 4.dp)
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MilliwaysBlue)
                }
                Text(
                    "Milliways",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
                Box {
                    IconButton(onClick = onViewOrder) {
                        Icon(Icons.Filled.ShoppingCart, contentDescription = "Cart", tint = MilliwaysBlue)
                    }
                    if (orderManager.totalQuantity > 0) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(top = 4.dp, end = 4.dp)
                                .size(16.dp)
                                .background(MilliwaysRed, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "${orderManager.totalQuantity}",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                menuSections.forEach { section ->
                    item {
                        Text(
                            section.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                    items(section.items) { menuItem ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            MenuItemCard(item = menuItem, onClick = { selectedItem = menuItem })
                        }
                    }
                }
                item {
                    Text(
                        "* Shipping beyond 5 light-years distance might cost extra",
                        style = MaterialTheme.typography.bodyMedium,
                        fontStyle = FontStyle.Italic,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 40.dp)
                    )
                }
            }

            if (orderManager.items.isNotEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 40.dp)
                        .background(MilliwaysOrange, RoundedCornerShape(12.dp))
                        .clickable(onClick = onViewOrder)
                        .padding(20.dp)
                ) {
                    Text("View Order", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    Text("${orderManager.totalQuantity} items", color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(end = 8.dp))
                    Text(formatPrice(orderManager.totalPrice), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    selectedItem?.let { item ->
        MenuItemDetailDialog(
            item = item,
            onDismiss = { selectedItem = null },
            onAddToOrder = { quantity ->
                orderManager.addItem(item, quantity)
                selectedItem = null
            }
        )
    }
}
