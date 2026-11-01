package com.mobilenext.Milliways.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.mobilenext.Milliways.ui.theme.MilliwaysOrange

private enum class LocationState { IDLE, LOCATING, LOCATED, FAILED }

private val groomLake = Location("groom-lake").apply {
    latitude = 37.2514326
    longitude = -115.8452064
}

// simulated geolocation isn't always exact, so allow some slack
private const val GROOM_LAKE_RADIUS_METERS = 5000f

fun profilePrefs(context: Context) = context.getSharedPreferences("profile", Context.MODE_PRIVATE)

fun savedProfileName(context: Context): String = profilePrefs(context).getString("name", "Glorpax")!!

@Composable
fun EditProfileScreen(onBack: () -> Unit, onSaved: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { profilePrefs(context) }

    var name by remember { mutableStateOf(prefs.getString("name", "Glorpax")!!) }
    var email by remember { mutableStateOf(prefs.getString("email", "glorpax@milliways.space")!!) }
    var phone by remember { mutableStateOf(prefs.getString("phone", "")!!) }
    var newsletter by remember { mutableStateOf(prefs.getBoolean("newsletter", false)) }
    var babelFish by remember { mutableStateOf(prefs.getBoolean("babelFish", true)) }

    var locationState by remember { mutableStateOf(LocationState.IDLE) }
    var isAtGroomLake by remember { mutableStateOf(false) }

    // BUG (intentional): only checks the email isn't empty, so "glorpax" without "@" is accepted
    val isEmailValid = email.isNotBlank()
    val isNameValid = name.isNotBlank()

    fun fetchLocation() {
        val manager = context.getSystemService(LocationManager::class.java)
        manager.getCurrentLocation(LocationManager.GPS_PROVIDER, null, ContextCompat.getMainExecutor(context)) { location ->
            if (location == null) {
                locationState = LocationState.FAILED
                return@getCurrentLocation
            }
            isAtGroomLake = location.distanceTo(groomLake) <= GROOM_LAKE_RADIUS_METERS
            locationState = LocationState.LOCATED
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants.values.any { it }) {
            fetchLocation()
        } else {
            locationState = LocationState.FAILED
        }
    }

    fun useMyLocation() {
        locationState = LocationState.LOCATING
        val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (granted) {
            fetchLocation()
        } else {
            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    fun save() {
        prefs.edit()
            .putString("name", name.trim())
            .putString("email", email.trim())
            .putString("phone", phone)
            .putBoolean("newsletter", newsletter)
            .putBoolean("babelFish", babelFish)
            .apply()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .imePadding()
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().padding(4.dp)
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            Text(
                "Edit Profile",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )
            TextButton(
                onClick = {
                    save()
                    onSaved()
                },
                enabled = isNameValid && isEmailValid
            ) {
                Text("Save", color = if (isNameValid && isEmailValid) MilliwaysOrange else Color.Gray)
            }
        }

        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            SectionHeader("Profile")
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Display name") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, autoCorrectEnabled = false),
                modifier = Modifier.fillMaxWidth()
            )
            if (!isEmailValid) {
                Text("Email is required", style = MaterialTheme.typography.bodySmall, color = Color.Red)
            }
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                modifier = Modifier.fillMaxWidth()
            )

            SectionHeader("Preferences")
            SwitchRow("Galactic newsletter", newsletter) { newsletter = it }
            SwitchRow("Babel fish translation", babelFish) { babelFish = it }

            SectionHeader("Delivery")
            TextButton(
                onClick = { useMyLocation() },
                enabled = locationState != LocationState.LOCATING
            ) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, tint = MilliwaysOrange)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Use my location", color = MilliwaysOrange)
                if (locationState == LocationState.LOCATING) {
                    Spacer(modifier = Modifier.width(8.dp))
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                }
            }
            if (locationState == LocationState.FAILED) {
                Text("Couldn't get your location", style = MaterialTheme.typography.bodySmall, color = Color.Red)
            }
        }
    }

    if (locationState == LocationState.LOCATED) {
        AlertDialog(
            onDismissRequest = { locationState = LocationState.IDLE },
            title = { Text(if (isAtGroomLake) "Groom Lake Happy Hour!" else "Delivering to Earth") },
            text = if (isAtGroomLake) {
                null
            } else {
                { Text("Delivering to Earth might take more time than usual, our couriers are busy") }
            },
            confirmButton = {
                TextButton(onClick = { locationState = LocationState.IDLE }) {
                    Text("OK")
                }
            }
        )
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(top = 8.dp)
    )
}

@Composable
private fun SwitchRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
