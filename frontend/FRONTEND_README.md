# XENIA Frontend

A modern, responsive React/Next.js frontend for the XENIA AI Study Suite application.

## ✨ Features

### 🎨 Design System
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Modern UI**: Clean, minimal design inspired by the reference templates
- **Responsive**: Fully responsive across desktop, tablet, and mobile devices
- **Animations**: Smooth transitions and micro-interactions using Framer Motion
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

### 🏗️ Architecture
- **Next.js 15**: App Router with TypeScript
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Radix UI**: Accessible, unstyled UI primitives
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **Supabase**: Authentication and real-time data

### 📱 Pages & Features

#### 🏠 Landing Page
- Hero section with animated elements
- Feature showcase with icons and descriptions
- Student testimonials
- Pricing plans (Free & Premium)
- Interactive FAQ section
- Professional footer

#### 🔐 Authentication
- **Login**: Email/password with remember me and forgot password
- **Register**: Multi-role registration (Student/Teacher/Parent)
- **Onboarding**: 4-step personalization flow with progress indicators

#### 📊 Dashboard
- **Student Dashboard**: Study plan overview, progress tracking, quick actions
- **Analytics Cards**: Tasks completed, study time, streaks, level progress
- **Charts**: Study progress visualization with Recharts
- **Quick Actions**: Direct access to key features

#### 📅 Study Suite
- **Kanban View**: Study sessions organized by date
- **Timeline View**: Tabular view with sorting and filtering
- **List View**: Detailed session cards with actions
- **AI Generation**: One-click plan regeneration

#### 🤖 AI Tutor
- **Chat Interface**: Modern messaging UI with user/AI bubbles
- **File Upload**: OCR support for images and documents
- **Quick Prompts**: Pre-defined question templates
- **History**: Persistent conversation history

#### 📈 Analytics
- **Progress Tracking**: Weekly completion rates and targets
- **Subject Mastery**: Individual subject progress with weak/strong areas
- **Study Time Analysis**: Daily study minutes visualization
- **AI Insights**: Personalized recommendations and tips

#### ✅ Tasks & Sessions
- **Task Management**: Create, track, and complete study tasks
- **Timer**: Built-in study timer with pause/resume
- **Progress Tracking**: Visual progress bars and completion rates
- **Session Logging**: Manual session tracking

#### 📤 Upload
- **Drag & Drop**: Intuitive file upload interface
- **File Management**: View, download, and delete uploaded files
- **Processing Status**: Real-time upload and processing status
- **Multiple Formats**: Support for PDF, images, and documents

#### 👨‍🏫 Teacher View
- **Student Management**: View all students and their progress
- **Class Analytics**: Overall class performance metrics
- **Topic Tagging**: Mark weak topics for targeted help
- **Insights**: AI-generated class performance insights

#### 👨‍👩‍👧‍👦 Parent View
- **Child Overview**: Comprehensive progress dashboard
- **Subject Performance**: Individual subject grades and progress
- **Activity Timeline**: Recent study sessions and achievements
- **Teacher Feedback**: Comments and recommendations from teachers

#### ⚙️ Settings
- **Profile Management**: Update personal information and preferences
- **Study Preferences**: Customize session length, goals, and break times
- **Notifications**: Control email, push, and reminder settings
- **Privacy**: Manage data sharing and access permissions
- **Theme**: Light/dark mode toggle with preview

### 🛠️ Technical Stack

#### Core Technologies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations and transitions

#### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **Recharts**: Data visualization
- **React Hook Form**: Form management
- **Zod**: Schema validation

#### State Management
- **React Query**: Server state and caching
- **React Context**: Global state (theme, errors)
- **Local State**: Component-level state with hooks

#### Authentication & Data
- **Supabase**: Authentication and database
- **Custom API Layer**: Type-safe API client with error handling

### 🎯 Key Features Implemented

#### ✅ Complete Feature Set
- [x] Landing page with all sections
- [x] Authentication (login/register/onboarding)
- [x] Student dashboard with analytics
- [x] AI tutor chat interface
- [x] Study suite with multiple views
- [x] Task and session management
- [x] File upload with drag-and-drop
- [x] Teacher dashboard and tools
- [x] Parent progress monitoring
- [x] Comprehensive settings
- [x] Error handling and loading states
- [x] Dark/light mode support
- [x] Responsive design
- [x] Smooth animations

#### 🎨 Design System
- [x] Consistent color palette
- [x] Typography scale
- [x] Spacing system
- [x] Component variants
- [x] Icon system
- [x] Animation library

#### 🔧 Developer Experience
- [x] TypeScript throughout
- [x] ESLint configuration
- [x] Component library
- [x] Error boundaries
- [x] Loading states
- [x] Type-safe API client

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── dashboard/         # Main dashboard
│   │   ├── onboarding/        # User onboarding flow
│   │   ├── parent/            # Parent dashboard
│   │   ├── planner/           # Study suite
│   │   ├── settings/          # User settings
│   │   ├── share/             # Shared study plans
│   │   ├── tasks/             # Task management
│   │   ├── teacher/           # Teacher dashboard
│   │   ├── tutor/             # AI tutor chat
│   │   ├── upload/            # File upload
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   │   ├── ui/                # UI component library
│   │   ├── landing/           # Landing page components
│   │   ├── navigation.tsx     # App navigation
│   │   ├── providers.tsx      # Context providers
│   │   └── theme-toggle.tsx   # Theme switcher
│   └── lib/                   # Utilities and configuration
│       ├── api.ts             # API client
│       ├── error-context.tsx  # Error handling
│       ├── errors.ts          # Error definitions
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── next.config.ts           # Next.js configuration
```

## 🎨 Design Tokens

### Colors
- **Primary**: Black (#000000) / White (#ffffff) in dark mode
- **Secondary**: Light gray (#f8fafc) / Dark gray (#16213e) in dark mode
- **Accent**: Interactive elements and highlights
- **Semantic**: Success (green), Warning (orange), Destructive (red), Info (blue)

### Typography
- **Font**: Inter (system fallback)
- **Scale**: 8-point scale from xs to 9xl
- **Weights**: 300-900 with emphasis on 400, 500, 600, 700

### Spacing
- **Scale**: 4px base unit (0.25rem)
- **Consistent**: Padding, margins, and gaps follow 4px grid

### Animations
- **Duration**: 150ms-500ms for different interaction types
- **Easing**: Custom bezier curves for natural motion
- **Hover States**: Subtle scale and shadow changes

## 🔧 Component Library

### Layout Components
- `Card` - Container component with variants
- `Modal` - Overlay dialogs and modals
- `Navigation` - Sidebar and mobile navigation
- `MainLayout` - Authenticated page layout wrapper

### Form Components
- `Button` - Multiple variants and sizes
- `Input` - Text inputs with icons and validation
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Boolean input
- `Label` - Form labels

### Data Display
- `Badge` - Status and category indicators
- `Progress` - Progress bars and completion indicators
- `Avatar` - User profile pictures
- `Skeleton` - Loading placeholders

### Feedback
- `Loading` - Loading spinners and states
- `EmptyState` - No data placeholders
- `ErrorBoundary` - Error handling wrapper

## 🌐 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Layout Strategy
- Mobile-first approach
- Flexible grid systems
- Collapsible navigation
- Touch-friendly interactions

## ♿ Accessibility

### Features
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: WCAG AA compliant
- **Focus Management**: Visible focus indicators
- **Semantic HTML**: Proper heading hierarchy

## 🔒 Security

### Measures
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user content
- **CSRF Protection**: Built-in Next.js protection
- **Authentication**: Secure Supabase integration

## 📱 Progressive Web App

### Features
- **Responsive**: Works on all device sizes
- **Fast Loading**: Optimized bundle size
- **Offline Ready**: Service worker support (future)
- **App-like**: Native app experience

## 🧪 Testing Strategy

### Approaches
- **Unit Tests**: Component testing with Jest
- **Integration Tests**: Page and flow testing
- **E2E Tests**: End-to-end user journeys
- **Accessibility Tests**: Automated a11y testing

## 🚀 Deployment

### Build Process
```bash
npm run build    # Production build
npm run start    # Production server
```

### Environment Setup
- Development: `npm run dev`
- Production: `npm run build && npm start`

## 📊 Performance

### Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Component and route lazy loading

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔄 State Management

### Patterns
- **Server State**: React Query for API data
- **Client State**: React hooks and context
- **Form State**: React Hook Form
- **Theme State**: Next Themes

## 🎯 Future Enhancements

### Planned Features
- [ ] Real-time notifications
- [ ] Offline support
- [ ] Advanced animations
- [ ] Mobile app (React Native)
- [ ] Voice commands
- [ ] Collaborative features

### Performance Improvements
- [ ] Bundle size optimization
- [ ] Image lazy loading
- [ ] Service worker implementation
- [ ] CDN integration

## 🤝 Contributing

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 📄 License

This project is part of the XENIA application suite.
