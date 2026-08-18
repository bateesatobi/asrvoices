# Quick Start Guide - ElevenLabs Redesign

## 🚀 Get Started in 5 Minutes

### Step 1: View the Component Showcase

```bash
# Start the development server
npm start

# Add this route temporarily to App.js
import ComponentShowcase from './components/Redesigned/ComponentShowcase';

// In your routes:
<Route path="/showcase" element={<ComponentShowcase />} />

# Visit: http://localhost:3000/showcase
```

### Step 2: Use UI Components

```jsx
// Import components
import {
  ElevenLabsButton,
  ElevenLabsCard,
  ElevenLabsModal,
} from './components/ElevenLabsUI';

// Use them
function MyComponent() {
  return (
    <ElevenLabsCard title="My Card">
      <ElevenLabsButton variant="primary">
        Click Me
      </ElevenLabsButton>
    </ElevenLabsCard>
  );
}
```

### Step 3: Try a Redesigned Page

```jsx
// Update any view file (e.g., src/views/DashboardHomeView.js)
import DashboardHomeElevenLabs from '../components/Redesigned/DashboardHomeElevenLabs';

const DashboardHomeView = () => {
  const [userId, setUserId] = useState(null);
  
  // ... existing userId logic
  
  return userId ? <DashboardHomeElevenLabs userId={userId} /> : null;
};
```

## 📚 Essential Files

### Documentation (Read These First)
1. `ELEVENLABS_REDESIGN_GUIDE.md` - Complete guide
2. `DESIGN_IMPLEMENTATION_SUMMARY.md` - Visual patterns
3. `DEPLOYMENT_CHECKLIST.md` - Deployment steps

### Code Locations
- **UI Components**: `src/components/ElevenLabsUI/`
- **Layout**: `src/components/Layout/`
- **Redesigned Pages**: `src/components/Redesigned/`
- **Styles**: `src/styles/elevenlabs-overrides.css`

## 🎨 Quick Component Reference

### Buttons
```jsx
<ElevenLabsButton variant="contained">Default</ElevenLabsButton>
<ElevenLabsButton variant="primary">Gold</ElevenLabsButton>
<ElevenLabsButton variant="outlined">Outlined</ElevenLabsButton>
<ElevenLabsButton variant="text">Text</ElevenLabsButton>
<ElevenLabsButton loading>Loading...</ElevenLabsButton>
```

### Cards
```jsx
<ElevenLabsCard title="Title" subtitle="Subtitle">
  Content
</ElevenLabsCard>
```

### Modal
```jsx
<ElevenLabsModal 
  open={open} 
  onClose={() => setOpen(false)}
  title="Modal Title"
  subtitle="Description"
>
  Content
</ElevenLabsModal>
```

### File Upload
```jsx
<ElevenLabsFileUpload
  onFileSelect={(file) => setFile(file)}
  selectedFile={file}
  onClearFile={() => setFile(null)}
/>
```

### Settings Panel
```jsx
<ElevenLabsSettingsPanel>
  <SettingSlider
    label="Speed"
    value={speed}
    onChange={(e, v) => setSpeed(v)}
    min={0.5}
    max={2.0}
  />
  
  <SettingToggle
    label="Enable Feature"
    checked={enabled}
    onChange={(e) => setEnabled(e.target.checked)}
  />
</ElevenLabsSettingsPanel>
```

## ✅ Quick Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Started dev server (`npm start`)
- [ ] Viewed ComponentShowcase
- [ ] Read ELEVENLABS_REDESIGN_GUIDE.md
- [ ] Tested a redesigned page
- [ ] Imported and used UI components
- [ ] Checked mobile responsiveness

## 🆘 Common Issues

**Issue**: Components not found  
**Fix**: Check import path: `'./components/ElevenLabsUI'`

**Issue**: Styles not applying  
**Fix**: Ensure `elevenlabs-overrides.css` imported in `index.js`

**Issue**: Layout broken  
**Fix**: Check that Sidenav.js is using new layout components

## 📞 Need Help?

- Check `ELEVENLABS_REDESIGN_GUIDE.md` for detailed docs
- View `ComponentShowcase.js` for examples
- Read component source files for prop documentation

---

**Ready to deploy?** See `DEPLOYMENT_CHECKLIST.md`
