# ApplyTrack

ApplyTrack is a full-stack job application management platform that helps users organize their job search, track application progress, and compare their resume against job descriptions.

## Live Demo

https://d2kxy3v5k8g8qh.cloudfront.net

## Features

- Add, edit, and delete job applications
- Track applications by status: Applied, Interview, and Offer
- Search applications by company or position
- Filter applications by status
- Dashboard statistics for applications, interviews, and offers
- Resume Match tool for comparing a resume with a job description
- Persistent application data stored in PostgreSQL
- Fully deployed on AWS with HTTPS

## Tech Stack

### Frontend
- React
- JavaScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic

### Database
- PostgreSQL

### Cloud / Deployment
- AWS S3
- AWS CloudFront
- AWS Elastic Beanstalk
- AWS RDS

## Architecture

The production application uses the following architecture:

React Frontend  
↓  
Amazon S3  
↓  
Amazon CloudFront (HTTPS)  
↓  
FastAPI Backend via CloudFront (HTTPS)  
↓  
AWS Elastic Beanstalk  
↓  
PostgreSQL on Amazon RDS

CloudFront provides HTTPS access to both the frontend and backend. The React production build is hosted in Amazon S3, while the FastAPI application runs on Elastic Beanstalk and communicates with PostgreSQL hosted on Amazon RDS.

## Running Locally

### Backend

Navigate to the backend directory:

```bash
cd backend