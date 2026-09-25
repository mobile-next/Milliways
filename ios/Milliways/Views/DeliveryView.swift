//
//  DeliveryView.swift
//  Milliways
//

import SwiftUI
import Combine

struct DeliveryView: View {
    @State private var minutesRemaining: Double
    @Environment(\.dismiss) var dismiss
    @ObservedObject var orderManager: OrderManager
    var onClose: () -> Void

    let timer = Timer.publish(every: 1.0 / 30.0, on: .main, in: .common).autoconnect()

    init(orderManager: OrderManager, onClose: @escaping () -> Void) {
        _minutesRemaining = State(initialValue: Double.random(in: 2_000_000...3_000_000))
        self.orderManager = orderManager
        self.onClose = onClose
    }

    var body: some View {
        ZStack {
            Image("NebulaMap")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                .ignoresSafeArea()

            VStack {
                Text("Your \(orderManager.items[0].menuItem.localizedName) is on its way!")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .shadow(radius: 4)
                    .padding(.horizontal)
                    .padding(.top, 120)

                Spacer()

                Text(String(format: localized("%.8f minutes for delivery"), minutesRemaining))
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.black.opacity(0.5))
                    .cornerRadius(12)
                    .padding(.bottom, 60)
            }
        }
        .onReceive(timer) { _ in
            if minutesRemaining > 0 {
                minutesRemaining -= Double.random(in: 0.01...0.05)
            }
        }
        .overlay(alignment: .topTrailing) {
            Button(action: {
                dismiss()
                onClose()
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(.white)
                    .shadow(radius: 2)
            }
            .padding(.trailing, 20)
            .padding(.top, 50)
        }
    }
}
