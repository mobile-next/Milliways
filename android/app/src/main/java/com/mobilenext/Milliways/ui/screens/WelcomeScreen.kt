package com.mobilenext.Milliways.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mobilenext.Milliways.R
import com.mobilenext.Milliways.model.OrderManager
import com.mobilenext.Milliways.ui.theme.MilliwaysOrange

@Composable
fun WelcomeScreen(
    orderManager: OrderManager,
    onNewOrder: () -> Unit
) {
    var showAccount by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        Image(
            painter = painterResource(R.drawable.hero_background),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Welcome to Milliways",
                color = Color.White,
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 100.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            val infiniteTransition = rememberInfiniteTransition(label = "float")
            val floatOffset by infiniteTransition.animateFloat(
                initialValue = 0f,
                targetValue = 20f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "floatOffset"
            )

            Image(
                painter = painterResource(R.drawable.hero_foreground),
                contentDescription = null,
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 8.dp)
                    .offset(y = (floatOffset - 40).dp)
            )

            Button(
                onClick = onNewOrder,
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(containerColor = MilliwaysOrange),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 48.dp)
                    .height(64.dp)
            ) {
                Text("New Order", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            }
        }

        IconButton(
            onClick = { showAccount = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 48.dp, end = 12.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.AccountCircle,
                contentDescription = "Account",
                tint = Color.White,
                modifier = Modifier.padding(4.dp)
            )
        }
    }

    if (showAccount) {
        AccountDialog(onDismiss = { showAccount = false })
    }
}
