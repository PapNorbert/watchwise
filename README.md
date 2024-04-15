# WatchWise

Welcome to WatchWise - a platform dedicated to sharing your enthusiasm for movies and series with like-minded individuals.

## Index

- [WatchWise](#watchwise)
  - [Index](#index)
  - [Description](#description)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Database](#database)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Commands](#commands)

## Description

WatchWise is a web application designed to coordinate group movie or TV series viewing sessions in real-world settings, bringing together friends, family, or like-minded enthusiasts to share in the collective enjoyment of cinematic wonders, as well as to foster discussion and exchange of opinions on related topics. Going beyond mere coordination, WatchWise serves as a dynamic hub where users can engage in discussions, share their thoughts, and explore different perspectives on the shows and movies they love.

In addition to facilitating group viewing sessions and discussions, WatchWise offers real-time chat functionality tailored to enhance the user experience. Each chat is dedicated to a specific watch group, providing a convenient platform for administrative discussions, coordinating schedules, getting to know each other, sharing post-watch party experiences, or exchanging recommendations for future viewing sessions.

Whether you're debating the plot twists of the latest episode or meticulously planning your next movie marathon, WatchWise ensures that the excitement of shared viewing comes to life, no matter your geographic location.

At its core, WatchWise is more than just a tool for organizing watch parties; it's a community-driven platform designed to foster connections, spark conversations, and celebrate the magic of storytelling together.

## Features

## Technologies Used 

### Frontend

### Backend

### Database

Data management is handled by `ArangoDB`, a multi-model NoSQL database system. Its support for various data models – graphs, documents, and key-value pairs – managed through a unified query language (AQL), grants the flexibility to adapt data structures as needed. This capability ensures ease of database modification, allowing for swift iterations and testing of different approaches.

## Usage

### Installation

1. Clone the repository
```bash
  git clone [repository-url]
``` 
1. Navigate to the project directory and install dependencies for both the client and server folder
```bash
  cd client
  npm install
  cd ../server
  npm install
``` 
1. Make sure that you have an ArangoDB connection available to you.
   
### Commands

1. Start the server
```bash
npm run start
``` 
2. Start the client
```bash
npm start
``` 

**Note**: Configuration files and environment variables (.env) are not included in the repository. 

