.PHONY: help zip ipa apk clean

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  zip    build iOS simulator app zip (ios/)"
	@echo "  ipa    build iOS ipa (ios/)"
	@echo "  apk    build Android apk (android/)"
	@echo "  clean  clean ios/ and android/"

zip:
	$(MAKE) -C ios zip

ipa:
	$(MAKE) -C ios ipa

apk:
	$(MAKE) -C android build

clean:
	$(MAKE) -C ios clean
	$(MAKE) -C android clean
