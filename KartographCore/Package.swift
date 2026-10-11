// swift-tools-version: 5.9
// Plattformunabhängige Spiellogik (Modell, Wertung, Speicherung).
// Die SwiftUI-App unter ../App bindet dieses Paket ein (siehe ../project.yml).
// Tests: `cd KartographCore && swift test` auf dem Mac oder in Xcode (Cmd+U).
import PackageDescription

let package = Package(
    name: "KartographCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "KartographCore", targets: ["KartographCore"])
    ],
    targets: [
        .target(name: "KartographCore"),
        .testTarget(name: "KartographCoreTests", dependencies: ["KartographCore"])
    ]
)
