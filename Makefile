build:
		docker build --build-arg WEB_APP_BRANCH=develop --build-arg VITE_API_URL=/api -t sibarifly-dashboard-api .
run:
		docker run --rm -it -p 8000:8000 sibarifly-dashboard-api /bin/sh

.PHONY: build clean
