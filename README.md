# Dream Wedding - React + Vite Application

This is a React + Vite migration of the Dream Wedding wedding planning website. The application has been converted from HTML/CSS/JS to React components with routing and API integration.

## Features

- **React + Vite**: Modern React build tool for fast development
- **React Router**: Client-side routing for all pages
- **API Integration**: Centralized API service layer for data operations
- **User Authentication**: Login and registration system
- **Booking System**: Create and manage wedding service bookings
- **Contact Form**: Submit inquiries via contact form
- **Gallery with Reviews**: View wedding gallery and submit reviews
- **Service Details**: Detailed service information with booking functionality

## Pages

- **Home** (`/`) - Hero slider, services overview, packages preview, gallery preview, testimonials
- **About** (`/about`) - Company story, philosophy, values
- **Services** (`/services`) - All wedding services
- **Service Detail** (`/service-detail`) - Detailed service information based on category
- **Packages** (`/packages`) - Wedding packages (Essential, Premium, Luxury)
- **Gallery** (`/gallery`) - Wedding gallery with review submission
- **Contact** (`/contact`) - Contact form
- **Login** (`/login`) - User login
- **Registration** (`/registration`) - User registration
- **Book Now** (`/book-now`) - Create new booking (requires login)
- **Bookings** (`/bookings`) - View user's bookings (requires login)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the react-app directory:
```bash
cd react-app
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## API Setup

The application uses a centralized API service layer that communicates with a JSON server. To set up the API:

1. Install json-server globally:
```bash
npm install -g json-server
```

2. Start the JSON server:
```bash
json-server --watch db.json --port 3000
```

The API will be available at `http://localhost:3000`

### API Endpoints

The following endpoints are available:

- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /bookings` - Get all bookings
- `POST /bookings` - Create a new booking
- `DELETE /bookings/:id` - Delete a booking
- `GET /contacts` - Get all contact submissions
- `POST /contacts` - Create a new contact submission
- `GET /reviews` - Get all reviews
- `POST /reviews` - Create a new review

## Project Structure

```
react-app/
├── public/
│   └── images/          # Static images
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Services.jsx
│   │   ├── ServiceDetail.jsx
│   │   ├── Packages.jsx
│   │   ├── Gallery.jsx
│   │   ├── Contact.jsx
│   │   ├── Login.jsx
│   │   ├── Registration.jsx
│   │   ├── BookNow.jsx
│   │   └── Bookings.jsx
│   ├── services/       # API service layer
│   │   └── api.js
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Entry point
│   ├── index.css       # Global styles
│   └── *.css           # Page-specific styles
├── db.json             # JSON server database
├── index.html          # HTML template
├── package.json        # Dependencies
└── vite.config.js      # Vite configuration
```

## Key Implementation Details

### API Service Layer

All API calls are centralized in `src/services/api.js`. Components import and use these functions instead of making direct fetch calls. This ensures:

- Single source of truth for API calls
- Consistent error handling
- Easy maintenance and updates

### React Hooks

JavaScript logic has been converted to React hooks:
- `useState` for component state management
- `useEffect` for side effects and data fetching
- `useSearchParams` for URL query parameters
- `useNavigate` for programmatic navigation

### Authentication

Authentication uses localStorage to persist user session:
- `dreamWedding_loggedIn` - Boolean flag for login state
- `dreamWedding_user` - User object with user details

### CSS

All original CSS files have been copied and imported into their respective components. The styling remains exactly the same as the original HTML/CSS version.

## Data Storage

The application uses `db.json` as the data store, managed by json-server. This includes:
- `users` - Registered users
- `bookings` - User bookings
- `contacts` - Contact form submissions
- `reviews` - Gallery reviews

## Notes

- The application maintains the exact same UI and functionality as the original HTML/CSS/JS version
- No visual or feature changes were made during the migration
- The code is kept simple and beginner-friendly
- All components use clear, descriptive variable and function names

---

## 🔐 Admin Panel Credentials

The Admin Panel is accessible at `/admin` route.

| Field    | Value      |
|----------|------------|
| **Email**    | `admin@`   |
| **Password** | `admin123` |

> **Note:** These are hardcoded credentials for development/demo purposes only.
> Do **not** use these in a production environment.
