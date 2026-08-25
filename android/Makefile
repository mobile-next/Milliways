GRADLEW = ./gradlew
APK_PATH = app/build/outputs/apk/release/Milliways.apk

.PHONY: build lint clean

build:
	$(GRADLEW) assembleRelease
	cp app/build/outputs/apk/release/app-release.apk $(APK_PATH)
	@echo "Created $(APK_PATH)"

lint:
	$(GRADLEW) lint
	@echo "Lint report: app/build/reports/lint-results-debug.html"

clean:
	$(GRADLEW) clean
