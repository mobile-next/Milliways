package com.mobilenext.Milliways.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.mobilenext.Milliways.R
import com.mobilenext.Milliways.model.formatPrice
import com.mobilenext.Milliways.ui.theme.MilliwaysOrange

private data class PastOrder(val date: String, val total: Double)

private val pastOrders = listOf(
    PastOrder("Feb 17, 2065", 78.50),
    PastOrder("Jun 3, 2065", 45.75),
    PastOrder("Oct 12, 2065", 112.00)
)

private enum class AccountPage { ACCOUNT, EDIT_PROFILE, README }

@Composable
fun AccountDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    var page by remember { mutableStateOf(AccountPage.ACCOUNT) }
    var name by remember { mutableStateOf(savedProfileName(context)) }

    Dialog(
        onDismissRequest = {
            if (page == AccountPage.ACCOUNT) {
                onDismiss()
            } else {
                page = AccountPage.ACCOUNT
            }
        },
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)
    ) {
        when (page) {
            AccountPage.EDIT_PROFILE -> EditProfileScreen(
                onBack = { page = AccountPage.ACCOUNT },
                onSaved = {
                    name = savedProfileName(context)
                    page = AccountPage.ACCOUNT
                }
            )
            AccountPage.README -> ReadmeScreen(onBack = { page = AccountPage.ACCOUNT })
            AccountPage.ACCOUNT -> AccountPageContent(name, onDismiss, onNavigate = { page = it })
        }
    }
}

@Composable
private fun AccountPageContent(name: String, onDismiss: () -> Unit, onNavigate: (AccountPage) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(4.dp)
        ) {
            Text(
                "My Account",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f).padding(start = 44.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            IconButton(onClick = onDismiss) {
                Icon(Icons.Filled.Close, contentDescription = "Close")
            }
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Hi $name!", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                        Text("Pro Cosmic Foodie 🌌", color = MilliwaysOrange, style = MaterialTheme.typography.bodyMedium)
                    }
                    Image(
                        painter = painterResource(R.drawable.avatar),
                        contentDescription = "Avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(70.dp)
                            .clip(CircleShape)
                            .border(2.dp, MilliwaysOrange, CircleShape)
                    )
                }
                HorizontalDivider()
                AccountLink("Edit Profile") { onNavigate(AccountPage.EDIT_PROFILE) }
                HorizontalDivider()
                AccountLink("README") { onNavigate(AccountPage.README) }
                HorizontalDivider()
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    AccountStat("3", "Orders")
                    AccountStat("₭431.93", "Total Spent")
                    AccountStat("19", "Light-years")
                }
                HorizontalDivider()
            }
            item {
                Text(
                    "Past Orders",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 8.dp)
                )
            }
            items(pastOrders) { order ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(order.date, fontWeight = FontWeight.SemiBold)
                        Text(
                            "Delivered across the galaxy",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(formatPrice(order.total), color = MilliwaysOrange, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun AccountLink(title: String, onClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Text(title, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun AccountStat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
