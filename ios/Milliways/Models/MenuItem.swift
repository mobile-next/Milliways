//
//  MenuItem.swift
//  Milliways
//
//  Created by gilm on 05/11/2025.
//

import SwiftUI

struct MenuItem: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let price: Double
    let color: Color
    var imageName: String? = nil

    // ponytail: menu content is stored as its own English key, so the string
    // catalog is the single place translations live — no parallel content model.
    var localizedName: String { localized(name) }
    var localizedDescription: String { localized(description) }
}

/// Looks a runtime string up in the string catalog, falling back to itself.
func localized(_ key: String) -> String {
    String(localized: String.LocalizationValue(key))
}
