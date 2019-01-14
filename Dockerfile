FROM node:alpine

# See for latest releases https://github.com/swagger-api/swagger-ui/releases
ENV SWAGGER_UI_VERSION 3.18.3

#PM2 will be used to start both swagger and slate apps as independent processes
RUN npm install pm2 -g

# Create the app directory
WORKDIR /usr/src/swaggerapp
WORKDIR /usr/src/slateapp

# Create directories and install necessary tools/libs
RUN mkdir -p /swaggerui/vena && apk update && apk add unzip coreutils git make g++ openssh

WORKDIR /swaggerui

# Download Swagger UI
ADD https://github.com/swagger-api/swagger-ui/archive/v${SWAGGER_UI_VERSION}.zip /swaggerui/${SWAGGER_UI_VERSION}.zip
COPY swagger.json /swaggerui/vena/swagger.json

# Unzip Swagger archive, copy dist files, delete unnecessary files and change the default endpoint
RUN unzip ${SWAGGER_UI_VERSION}.zip && \
    rm ${SWAGGER_UI_VERSION}.zip && \
    mv swagger-ui-${SWAGGER_UI_VERSION}/dist/* . && \
    rm -r swagger-ui-${SWAGGER_UI_VERSION}/ && \
    sed -i "s|https://petstore.swagger.io/v2/swagger.json|/swagger|g" index.html

WORKDIR /usr/src/swaggerapp

# Copy both package.json & package-lock.json using wildcard
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code files to docker image
COPY . .

# Configure slate
WORKDIR /usr/src/slateapp

RUN git clone https://github.com/sdelements/node-slate.git

WORKDIR /usr/src/slateapp/node-slate

RUN npm install

# Copy the process.yml for pm2 as well as vena logo for slate
COPY process.yml /usr/src/slateapp/node-slate/process.yml
COPY /logo/logo.png /usr/src/slateapp/node-slate/source/images/logo.png
COPY utils/Introduction.md /usr/src/slateapp/node-slate/source/includes/introduction.md
COPY utils/index.yml /usr/src/slateapp/node-slate/source/index.yml

# Run the app
CMD ["pm2-runtime", "process.yml"]
