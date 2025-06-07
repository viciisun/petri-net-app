# Petri Net Visualizer

A modern, interactive web application for visualizing, editing, and analyzing Petri net models. Built with React and FastAPI, this tool provides a comprehensive platform for working with PNML (Petri Net Markup Language) files.

## 🌟 Features

### Core Functionality

#### 📁 Import & Export

- **PNML Import**: Upload and parse PNML files with full PM4Py integration
- **Image Export**: Export visualizations as high-quality PNG or JPEG images
- **Future Support**: Event log files (CSV, XES) and PNML export (coming soon)

#### 🎨 Visualization

- **Interactive Canvas**: Powered by React Flow for smooth, responsive interactions
- **Custom Node Types**: Specialized Place and Transition node components
- **Smart Layouts**: Automatic positioning with Dagre algorithm (horizontal/vertical)
- **Visual Indicators**: Color-coded markings, invisible transitions, and connection handles

#### ✏️ Editing Capabilities

- **Node Management**: Add, delete, and modify places and transitions
- **Property Editing**: Real-time editing of node properties (ID, name, tokens, etc.)
- **Connection System**: Drag-and-drop edge creation with bipartite graph validation
- **Reconnectable Edges**: Modify existing connections by dragging endpoints

### Advanced Features

#### 🔧 Intelligent Node Handling

- **Attach Points**: Dynamic connection handles based on node positioning
- **ID Management**: Automatic ID generation and duplicate prevention
- **Type Validation**: Enforced Petri net rules (places ↔ transitions only)
- **Auto-reconnection**: Smart edge updates when deleting intermediate nodes

#### 📊 Real-time Analytics

- **Live Statistics**: Automatic calculation of network metrics
- **Marking Detection**: Initial and final marking identification
- **Transition Analysis**: Visible vs. invisible transition tracking
- **Token Counting**: Real-time token distribution monitoring

#### 🎯 User Experience

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Keyboard Shortcuts**: Efficient navigation and editing
- **Visual Feedback**: Hover effects, selection states, and status indicators
- **Error Handling**: Graceful error management with user-friendly messages

### Technical Features

#### 🏗️ Architecture

- **Frontend**: React 19 + Vite + Zustand state management
- **Backend**: FastAPI + PM4Py for PNML processing
- **Visualization**: React Flow with custom node components
- **Layout**: Dagre algorithm for automatic graph positioning

#### 🔄 Data Flow

- **Real-time Sync**: Instant updates between UI and state
- **Efficient Rendering**: Optimized re-rendering with React optimizations
- **Memory Management**: In-memory caching for fast access
- **API Integration**: RESTful backend communication

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- Modern web browser with ES6+ support

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd petri-net-app
   ```

2. **Backend Setup**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend** (Terminal 1)

   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the Frontend** (Terminal 2)

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:5173`
   - Backend API available at `http://localhost:8000`
   - API documentation at `http://localhost:8000/docs`

## 📖 User Guide

### Importing PNML Files

1. Click the **Import** button in the header
2. Select **PNML Model** from the dropdown
3. Choose your `.pnml` file
4. The Petri net will be automatically parsed and visualized

### Editing Petri Nets

#### Adding Nodes

1. Use the **Tools Panel** on the left sidebar
2. Click **Place** or **Transition** to add new nodes
3. Nodes appear at a fixed position (100, 100) for consistent placement

#### Editing Properties

1. Click on any node or edge to select it
2. Use the **Element Panel** to modify properties:
   - **Places**: ID, Name, Tokens, Initial/Final marking
   - **Transitions**: ID, Name, Invisible flag
   - **Arcs**: Weight (ID, Source, Target are read-only)

#### Creating Connections

1. Drag from any connection handle (blue circles) on a node
2. Drop on a compatible node (places connect to transitions and vice versa)
3. Invalid connections are automatically prevented

#### Network Management

1. Use the **Network Panel** to edit network-level properties
2. View real-time statistics including:
   - Node counts (places, transitions)
   - Arc count and total tokens
   - Marking status and soundness

### Layout Options

- **Horizontal Layout**: Left-to-right flow (default)
- **Vertical Layout**: Top-to-bottom flow
- Switch layouts using the buttons in the header

### Exporting

1. Click the **Save** button in the header
2. Choose export format:
   - **PNG Image**: High-quality raster image
   - **JPEG Image**: Compressed image format
   - **PNML Model**: (Coming soon) Export current state as PNML

## 🛠️ Development

### Project Structure

```
petri-net-app/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API and layout services
│   │   ├── store/          # Zustand state management
│   │   └── types/          # Type definitions
│   └── package.json
└── documents/              # Documentation
    ├── system-architecture.md
    ├── data-flow-diagram.md
    └── README.md
```

### Key Components

#### Frontend Components

- **Header**: Import/export controls and layout options
- **ReactFlowCanvas**: Main visualization canvas
- **Toolbar**: Left sidebar with tools, element, and network panels
- **PlaceNode/TransitionNode**: Custom node components
- **ElementPanel**: Property editor for selected elements
- **NetworkPanel**: Network-level information and statistics

#### Backend Services

- **PM4PyService**: PNML parsing and data transformation
- **PetriNet API**: RESTful endpoints for file operations
- **Data Models**: Pydantic models for type safety

### API Endpoints

- `POST /api/upload-pnml` - Upload and parse PNML files
- `GET /api/petri-net/{id}` - Retrieve parsed Petri net data
- `GET /api/statistics/{id}` - Get network statistics
- `DELETE /api/petri-net/{id}` - Remove cached data
- `GET /api/health` - Health check endpoint

### State Management

The application uses Zustand for state management with the following key state:

```javascript
{
  nodes: [],              // React Flow nodes
  edges: [],              // React Flow edges
  layoutDirection: 'horizontal',
  isLoading: false,
  error: null,
  selectedElement: null,
  statistics: {...},      // Real-time network statistics
  networkId: '',
  networkName: ''
}
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEBUG=true
```

#### Frontend (vite.config.js)

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
python -m pytest tests/
```

### Frontend Testing

```bash
cd frontend
npm run test
```

## 📋 Supported PNML Features

### Fully Supported

- ✅ Places with initial markings
- ✅ Transitions (visible and invisible)
- ✅ Arcs with weights
- ✅ Final markings
- ✅ Network metadata (ID, name)
- ✅ Original element IDs preservation

### Partially Supported

- ⚠️ Complex arc expressions (simplified to weights)
- ⚠️ Advanced PNML extensions (basic support)

### Future Support

- 🔄 Event log import (CSV, XES)
- 🔄 PNML export functionality
- 🔄 Process mining integration
- 🔄 Advanced analysis features

## 🐛 Known Issues

1. **Large Networks**: Performance may degrade with 100+ nodes
2. **Mobile Touch**: Some drag operations may be less responsive on mobile
3. **Browser Compatibility**: Requires modern browser with ES6+ support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure cross-browser compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **PM4Py**: Excellent Python library for process mining
- **React Flow**: Powerful graph visualization library
- **FastAPI**: Modern, fast Python web framework
- **Dagre**: Graph layout algorithm implementation

## 📞 Support

For questions, issues, or contributions:

- Create an issue on GitHub
- Check the documentation in the `/documents` folder
- Review the API documentation at `/docs` endpoint

---

**Built with ❤️ using React, FastAPI, and PM4Py**
