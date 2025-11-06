# YieldFood

YieldFood is a web application designed to help restaurants automatically forecast their ingredient orders based on sales data. This project utilizes a modern tech stack, including FastAPI for the backend, Supabase for the database, and Next.js with TailwindCSS for the frontend.

## Project Structure

The project is organized into two main directories: `backend` and `frontend`.

### Backend

- **FastAPI**: The backend is built using FastAPI, providing a robust and efficient API for handling requests.
- **Supabase**: The database is managed using Supabase, allowing for easy data storage and retrieval.
- **Endpoints**:
  - `GET /sales`: Retrieves sales data.
  - `GET /forecast`: Calculates and retrieves forecast data based on sales.
  - `POST /order/preview`: Generates a preview of the order based on the forecast.

### Frontend

- **Next.js**: The frontend is developed using Next.js, enabling server-side rendering and static site generation.
- **TailwindCSS**: The application is styled using TailwindCSS, ensuring a responsive and modern design.
- **Dashboard**: A simple dashboard page displays sales forecasts in a responsive table format.

## Getting Started

### Prerequisites

- Python 3.7+
- Node.js 14+
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd YieldFood
   ```

2. Set up the backend:
   - Navigate to the `backend` directory.
   - Install the required Python packages:
     ```
     pip install -r requirements.txt
     ```
   - Configure your environment variables in `.env` based on `.env.example`.

3. Set up the frontend:
   - Navigate to the `frontend` directory.
   - Install the required Node.js packages:
     ```
     npm install
     ```
   - Configure your environment variables in `.env.local` based on `.env.local.example`.

### Running the Application

- Start the backend server:
  ```
  uvicorn app.main:app --reload
  ```

- Start the frontend development server:
  ```
  npm run dev
  ```

Visit `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.