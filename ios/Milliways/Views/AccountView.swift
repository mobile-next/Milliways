//
//  AccountView.swift
//  Milliways
//

import SwiftUI

struct PastOrder: Identifiable {
    let id = UUID()
    let date: String
    let total: Double
}

struct AccountView: View {
    @Environment(\.dismiss) var dismiss

    let pastOrders = [
        PastOrder(date: "Feb 17, 2065", total: 78.50),
        PastOrder(date: "Jun 3, 2065", total: 45.75),
        PastOrder(date: "Oct 12, 2065", total: 112.00)
    ]

    var body: some View {
        NavigationView {
            List {
                // Profile header
                Section {
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Hi Glorpax!")
                                .font(.system(size: 26, weight: .bold))
                            Text("Pro Cosmic Foodie 🌌")
                                .font(.subheadline)
                                .foregroundColor(.orange)
                        }

                        Spacer()

                        Image("Avatar")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 70, height: 70)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.orange, lineWidth: 2))
                    }
                    .padding(.vertical, 8)
                }

                // Stats
                Section {
                    HStack {
                        VStack {
                            Text("3")
                                .font(.title)
                                .fontWeight(.bold)
                            Text("Orders")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)

                        Divider()

                        VStack {
                            Text("₭431.93")
                                .font(.title)
                                .fontWeight(.bold)
                            Text("Total Spent")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)

                        Divider()

                        VStack {
                            Text("19")
                                .font(.title)
                                .fontWeight(.bold)
                            Text("Light-years")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.vertical, 8)
                }

                // Past orders
                Section(header: Text("Past Orders")) {
                    ForEach(pastOrders) { order in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(LocalizedStringKey(order.date))
                                    .font(.headline)
                                Text("Delivered across the galaxy")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text("₭\(order.total, specifier: "%.2f")")
                                .font(.headline)
                                .foregroundColor(.orange)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("My Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}
