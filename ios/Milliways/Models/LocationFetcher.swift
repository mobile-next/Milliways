//
//  LocationFetcher.swift
//  Milliways
//

import CoreLocation
import Combine

enum LocationState {
    case idle
    case locating
    case located
    case failed
}

class LocationFetcher: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let groomLake = CLLocation(latitude: 37.2514326, longitude: -115.8452064)
    // simulated geolocation isn't always exact, so allow some slack
    static let groomLakeRadiusMeters: CLLocationDistance = 5000

    @Published var state: LocationState = .idle
    @Published var lastLocation: CLLocation?
    private let manager = CLLocationManager()

    var isAtGroomLake: Bool {
        guard let lastLocation else {
            return false
        }
        return lastLocation.distance(from: Self.groomLake) <= Self.groomLakeRadiusMeters
    }

    override init() {
        super.init()
        manager.delegate = self
    }

    func fetch() {
        state = .locating
        manager.requestWhenInUseAuthorization()
        manager.requestLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        lastLocation = locations.last
        state = .located
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // requestLocation fails while the permission prompt is still up; wait for the answer instead
        if manager.authorizationStatus == .notDetermined {
            return
        }
        state = .failed
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard state == .locating else {
            return
        }
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied, .restricted:
            state = .failed
        default:
            break
        }
    }
}
