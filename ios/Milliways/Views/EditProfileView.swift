//
//  EditProfileView.swift
//  Milliways
//

import SwiftUI

struct EditProfileView: View {
    @Environment(\.dismiss) var dismiss

    @AppStorage("profile.name") private var savedName = "Glorpax"
    @AppStorage("profile.email") private var savedEmail = "glorpax@milliways.space"
    @AppStorage("profile.phone") private var savedPhone = ""
    @AppStorage("profile.newsletter") private var savedNewsletter = false
    @AppStorage("profile.babelFish") private var savedBabelFish = true

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var newsletter = false
    @State private var babelFish = true
    @State private var didLoad = false
    @StateObject private var location = LocationFetcher()

    // BUG (intentional): only checks the email isn't empty, so "glorpax" without "@" is accepted
    private var isEmailValid: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var isNameValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        Form {
            Section(header: Text("Profile")) {
                TextField("Display name", text: $name)
                    .textInputAutocapitalization(.words)
                    .accessibilityLabel("Display name")
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .accessibilityLabel("Email")
                if !isEmailValid {
                    Text("Email is required")
                        .font(.caption)
                        .foregroundColor(.red)
                }
                TextField("Phone", text: $phone)
                    .keyboardType(.phonePad)
                    .accessibilityLabel("Phone")
            }

            Section(header: Text("Preferences")) {
                Toggle("Galactic newsletter", isOn: $newsletter)
                Toggle("Babel fish translation", isOn: $babelFish)
            }

            Section(header: Text("Delivery")) {
                Button(action: { location.fetch() }) {
                    HStack {
                        Label("Use my location", systemImage: "location.fill")
                        if location.state == .locating {
                            Spacer()
                            ProgressView()
                        }
                    }
                }
                .disabled(location.state == .locating)
                if location.state == .failed {
                    Text("Couldn't get your location")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .alert(location.isAtGroomLake ? "Groom Lake Happy Hour!" : "Delivering to Earth", isPresented: Binding(
            get: { location.state == .located },
            set: { isPresented in
                if !isPresented {
                    location.state = .idle
                }
            }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            if !location.isAtGroomLake {
                Text("Delivering to Earth might take more time than usual, our couriers are busy")
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    save()
                    dismiss()
                }
                .disabled(!isNameValid || !isEmailValid)
            }
        }
        .onAppear {
            // ponytail: load once so returning from the keyboard doesn't wipe edits
            if !didLoad {
                name = savedName
                email = savedEmail
                phone = savedPhone
                newsletter = savedNewsletter
                babelFish = savedBabelFish
                didLoad = true
            }
        }
    }

    private func save() {
        savedName = name.trimmingCharacters(in: .whitespaces)
        savedEmail = email.trimmingCharacters(in: .whitespaces)
        savedPhone = phone
        savedNewsletter = newsletter
        savedBabelFish = babelFish
    }
}
