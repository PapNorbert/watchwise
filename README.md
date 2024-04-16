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

The application contains 4 different user roles: Guest, User, Moderator and Admin. They have access to different functionalities and privileges.

1. Guest
   - View guidelines and announcements.
   - Search movies and series
   - Search movie/series watching groups.
   - Search threads created by users focusing on specific movies or series.
   - Filtering and sorting at search.
   - Access detailed pages for watch groups, opinion threads, movies, and series.
   - Registration
2. User
   - Login
   - Follow opinion threads
   - Join watch groups
   - Writing comments
   - Create opinion threads or watch groups
   - Editing of own groups and threads
   - Use real-time chat for joined groups
3. Moderator
   - Delete groups, threads, comments that do not follow the guidelines
4. Admin
   - Create announcements
   - Manage moderators and users
   - Open and close moderator recruitement

## Technologies Used 

### Frontend

- **React**: A JavaScript library for building user interfaces, used for creating the interactive components and views of the application.
- **Bootstrap**: A popular CSS framework for building responsive and mobile-first websites, utilized for styling and layout components of the application.
- **Axios**: A promise-based HTTP client for making API requests, utilized for fetching and sending data to the backend server.
- **Leaflet**: An open-source JavaScript library for interactive maps, employed for displaying and interacting with maps in the application.
  
### Backend

- **Node.js**: A JavaScript runtime environment that allows the execution of JavaScript code outside of a web browser, used as the server-side platform for running the backend logic and handling requests, including the implementation of a **RESTful API**.
- **npm**: The default package manager for Node.js, used for installing and managing dependencies and packages required for the backend functionality.
- **Socket.IO**: A JavaScript library for real-time web applications, enabling bidirectional communication between web clients and servers. Socket.IO is utilized for implementing real-time features such as chat functionality.
- **JWT (JSON Web Tokens)**: A compact, URL-safe means of representing claims to be transferred between two parties. Used for authentication and authorization in the application, provides a secure way to transmit information between the client and server.
- **CORS (Cross-Origin Resource Sharing)**: A mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served. CORS is used to enable secure cross-origin communication between the frontend and backend of the application, ensuring proper handling of requests and responses across different origins.

### Database

Data management is handled by **ArangoDB**, a multi-model NoSQL database system. Its support for various data models – graphs, documents, and key-value pairs – managed through a unified query language (AQL), grants the flexibility to adapt data structures as needed. This capability ensures ease of database modification, allowing for swift iterations and testing of different approaches.

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

