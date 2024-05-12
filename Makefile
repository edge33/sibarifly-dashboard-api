build:
		docker build -t sibarifly-dashboard-api .
run:
		docker run --rm -p 8000:8000 sibarifly-dashboard-api

.PHONY: build clean
