//
//  MenuView.swift
//  Milliways
//
//  Created by gilm on 05/11/2025.
//

import SwiftUI

struct MenuSection {
    let title: String
    let items: [MenuItem]
}

struct MenuView: View {
    @ObservedObject var orderManager: OrderManager
    @Binding var popToRoot: Bool
    @State private var selectedItem: MenuItem?

    let mainDishes: [MenuItem] = [
        MenuItem(name: "Ameglian Major Cow", description: "The finest cut from a cow that wants to be eaten", price: 35.00, color: .brown, imageName: "Steak"),
        MenuItem(name: "Green Salad", description: "Fresh greens from the hydroponic gardens of Alpha Centauri", price: 22.00, color: .green, imageName: "GreenSalad"),
        MenuItem(name: "Soup of the Day", description: "Today's special soup, ingredients vary by solar system", price: 28.00, color: .orange, imageName: "Soup"),
        MenuItem(name: "Quantum Shrimp Cascade", description: "A bowl of shrimp that exist in multiple flavor states until you take the first bite", price: 38.00, color: .pink, imageName: "Shrimp"),
        MenuItem(name: "Krikkit Fried Logic", description: "An impossible dish that paradoxically tastes like everything you've ever eaten and nothing at all", price: 40.00, color: .cyan, imageName: "FriedLogic")
    ]

    let drinks: [MenuItem] = [
        MenuItem(name: "Pan Galactic Gargle Blaster", description: "Like having your brains smashed out by a slice of lemon wrapped around a large gold brick", price: 5.50, color: .yellow, imageName: "PanGalacticGargleBlaster"),
        MenuItem(name: "Water", description: "Pure H2O from Earth's finest springs", price: 3.00, color: .blue, imageName: "Water"),
        MenuItem(name: "Coffee", description: "Hot caffeinated beverage to keep you awake through the apocalypse", price: 4.50, color: .brown, imageName: "Coffee"),
        MenuItem(name: "Infinite Improbability Float", description: "Odds of getting the same flavor twice are approximately 1 in 10⁸⁰⁰⁰⁰⁰", price: 6.00, color: .purple, imageName: "InfiniteImprobabilityFloat"),
        MenuItem(name: "Dark Matter Martini", description: "So dense it distorts the glass around it; one sip and your hangover develops before you finish drinking", price: 5.75, color: .black, imageName: "DarkMatterMartini")
    ]

    var menuSections: [MenuSection] {
        [
            MenuSection(title: "MAIN DISHES", items: mainDishes),
            MenuSection(title: "DRINKS", items: drinks)
        ]
    }

    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                ScrollView {
                    LazyVStack(spacing: 12, pinnedViews: [.sectionHeaders]) {
                        ForEach(menuSections, id: \.title) { section in
                            Section {
                                ForEach(section.items) { item in
                                    MenuItemCard(item: item)
                                        .onTapGesture {
                                            selectedItem = item
                                        }
                                        .padding(.horizontal)
                                }
                            } header: {
                                HStack {
                                    Text(LocalizedStringKey(section.title))
                                        .font(.headline)
                                        .foregroundColor(.secondary)
                                        .padding(.horizontal)
                                        .padding(.vertical, 8)
                                    Spacer()
                                }
                                .background(Color(.systemBackground))
                            }
                        }

                        Text("* Shipping beyond 5 light-years distance might cost extra")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                            .italic()
                            .padding(.horizontal)
                            .padding(.top, 20)
                            .padding(.bottom, 40)
                    }
                    .padding(.vertical)
                }

                if orderManager.items.count > 0 {
                    NavigationLink(destination: OrderView(orderManager: orderManager, popToRoot: $popToRoot)) {
                        HStack {
                            Text("View Order")
                                .font(.headline)
                            Spacer()
                            Text("\(orderManager.totalQuantity) items")
                                .font(.subheadline)
                            Text("₭\(orderManager.totalPrice, specifier: "%.2f")")
                                .font(.headline)
                        }
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.orange)
                        .cornerRadius(12)
                        .padding()
                    }
                }
            }

        }
        .navigationTitle("Milliways")
        .navigationBarBackButtonHidden(true)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.accentColor)
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: OrderView(orderManager: orderManager, popToRoot: $popToRoot)) {
                    VStack(spacing: 0) {
                        if orderManager.totalQuantity > 0 {
                            Text("\(orderManager.totalQuantity)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 16, height: 16)
                                .background(Color.red)
                                .clipShape(Circle())
                        }
                        Image(systemName: "cart")
                            .foregroundColor(.accentColor)
                    }
                }
            }
        }
        .sheet(item: $selectedItem) { item in
            MenuItemDetailView(item: item, orderManager: orderManager)
        }
    }
}
