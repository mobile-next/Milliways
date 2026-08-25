GRADLEW = ./gradlew
APK_PATH = app/build/outputs/apk/debug/Milliways.apk

.PHONY: build lint clean

build:
	$(GRADLEW) assembleDebug
	cp app/build/outputs/apk/debug/app-debug.apk $(APK_PATH)
	@echo "Created $(APK_PATH)"

lint:
	$(GRADLEW) lint
	@echo "Lint report: app/build/reports/lint-results-debug.html"

clean:
	$(GRADLEW) clean
