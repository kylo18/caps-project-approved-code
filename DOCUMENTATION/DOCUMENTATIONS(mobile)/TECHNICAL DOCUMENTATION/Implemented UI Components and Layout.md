# Implemented UI Components and Layout

## Purpose
This document provides a detailed overview of the implemented UI components and layout structure of the mobile application, based on the `FrontendMobile` folder. It is intended for developers and designers to understand the design system, its implementation, and the rationale behind the layout choices.

---

## Table of Contents
1. [Overview](#overview)
2. [UI Components](#ui-components)
   - [Buttons](#buttons)
   - [Forms](#forms)
   - [Cards](#cards)
   - [Modals](#modals)
   - [Lists](#lists)
   - [Navigation Components](#navigation-components)
3. [Layout Structure](#layout-structure)
   - [Navigation](#navigation)
   - [Screen Layouts](#screen-layouts)
4. [Styling Guidelines](#styling-guidelines)
5. [Component File Structure](#component-file-structure)

---

## Overview
The mobile application uses a modular and reusable design system to ensure consistency and scalability. All UI components are implemented using React Native and styled with Tailwind CSS. The design system adheres to modern UI/UX principles, ensuring accessibility and responsiveness across devices.

---

## UI Components

### Buttons
#### Description
- Buttons are interactive elements used for triggering actions.

#### Types
1. **Primary Button**: Used for main actions, styled with prominent colors.
2. **Secondary Button**: Used for secondary actions, styled with neutral tones.
3. **Icon Button**: Used for actions represented by icons (e.g., search, settings).
4. **Floating Action Button (FAB)**: Circular buttons used for quick access to primary actions.

#### Implementation
- File: `src/components/Button.js`
- Example Usage:
```jsx
<Button type="primary" onPress={handleSubmit}>Submit</Button>
```

### Forms
#### Description
- Forms are used for collecting user input.

#### Components
1. **Input Fields**: Text, email, and password fields.
2. **Dropdowns**: For selecting options from a list.
3. **Checkboxes and Radio Buttons**: For multiple-choice inputs.
4. **Validation Messages**: Displayed for invalid inputs.

#### Implementation
- File: `src/components/Form.js`
- Example Usage:
```jsx
<Form>
  <InputField label="Email" type="email" />
  <Button type="primary">Submit</Button>
</Form>
```

### Cards
#### Description
- Cards are used for displaying grouped information in a visually appealing way.

#### Examples
1. **Profile Card**: Displays user profile information.
2. **Notification Card**: Displays notifications with timestamps.
3. **Course Card**: Displays course details such as title, instructor, and schedule.

#### Implementation
- File: `src/components/Card.js`
- Example Usage:
```jsx
<Card title="Course Title" description="Instructor: John Doe" />
```

### Modals
#### Description
- Modals are used for displaying information or actions in a focused view.

#### Examples
1. **Confirmation Modal**: Used for confirming actions.
2. **Form Modal**: Used for input forms.

#### Implementation
- File: `src/components/Modal.js`
- Example Usage:
```jsx
<Modal visible={isVisible} onClose={handleClose}>
  <Text>Are you sure?</Text>
</Modal>
```

### Lists
#### Description
- Lists are used for displaying collections of items.

#### Examples
1. **Student List**: Displays a list of students enrolled in a course.
2. **Notification List**: Displays recent notifications.

#### Implementation
- File: `src/components/List.js`
- Example Usage:
```jsx
<List data={students} renderItem={renderStudent} />
```

### Navigation Components
#### Description
- Navigation components are used for navigating between screens.

#### Examples
1. **Bottom Navigation Bar**: Used for switching between main sections.
2. **Drawer Navigation**: Provides access to additional sections.

#### Implementation
- File: `src/navigation/Navigation.js`
- Example Usage:
```jsx
<BottomNavigation>
  <Tab label="Home" icon="home" />
  <Tab label="Profile" icon="user" />
</BottomNavigation>
```

---

## Layout Structure

### Navigation
- **Bottom Navigation Bar**: Used for switching between main sections (e.g., Home, Profile, Settings).
- **Top Navigation Bar**: Used for contextual actions and navigation.

### Screen Layouts
1. **Dashboard**
   - Displays an overview of user activities and notifications.
2. **Profile Screen**
   - Displays and allows editing of user profile information.
3. **Settings Screen**
   - Provides options for configuring the application.
4. **Course Screen**
   - Displays course details and enrolled students.

---

## Styling Guidelines
- Use Tailwind CSS for consistent styling.
- Follow the design system for spacing, colors, and typography.
- Ensure all components are responsive and accessible.
- Use theme-based styling for dark mode support.

---

## Component File Structure
The `FrontendMobile` folder follows a modular structure for organizing components:

```
FrontendMobile/
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Form.js
│   │   ├── List.js
│   │   └── Modal.js
│   ├── navigation/
│   │   └── Navigation.js
│   ├── screens/
│   │   ├── Dashboard.js
│   │   ├── Profile.js
│   │   ├── Settings.js
│   │   └── Course.js
│   └── utils/
│       └── helpers.js
└── assets/
    ├── images/
    └── styles/
```

---

*End of Document*