//
//  ReadmeView.swift
//  Milliways
//

import SwiftUI
import WebKit

struct ReadmeView: View {
    var body: some View {
        WebView(url: URL(string: "https://github.com/mobile-next/Milliways/blob/main/README.md")!)
            .navigationTitle("README")
            .navigationBarTitleDisplayMode(.inline)
    }
}

// ponytail: UIKit wrapper, SwiftUI's own WebView needs iOS 26 and we target 17.6
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        // lets Safari Web Inspector (and mobilewright's getByWebView) attach to it
        webView.isInspectable = true
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
