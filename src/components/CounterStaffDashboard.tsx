import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Minus, 
  Edit,
  Check,
  RotateCcw,
  ShoppingCart  // Add this import
} from "lucide-react";
import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PhotoEditor } from "./PhotoEditor";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

// Update the Session interface to include edited images tracking
interface Session {
  id: string;
  name: string;
  date: string;
  type: string;
  images: string[];
  customerDetails: {
    name: string;
    location: string;
    date: string;
  };
  status: "pending" | "ready" | "completed";
  printCount?: number;
  editedImages?: Set<number> | number[]; // Support both Set and Array
  originalImages?: string[]; // Keep track of original images
}

const mockSessions: Session[] = [
  {
    id: "1",
    name: "Family Portrait",
    date: "2024-07-20",
    type: "Family",
    status: "pending",
    printCount: 2,
    images: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&h=600&fit=crop",
    ],
    customerDetails: {
      name: "Johnson Family",
      location: "Central Park",
      date: "2024-07-20"
    }
  },
  {
    id: "2",
    name: "Wedding Photography",
    date: "2024-07-15",
    type: "Wedding",
    status: "pending",
    printCount: 5,
    images: [
      "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1441057206919-63d19fac2369?w=800&h=600&fit=crop",
    ],
    customerDetails: {
      name: "Sarah & Mike",
      location: "Riverside Gardens",
      date: "2024-07-15"
    }
  },
  {
    id: "3",
    name: "Graduation Photoshoot",
    date: "2024-07-10",
    type: "Graduation",
    status: "ordered",
    printCount: 3,
    images: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&h=600&fit=crop",
    ],
    customerDetails: {
      name: "Emily Rodriguez",
      location: "University Campus",
      date: "2024-07-10"
    }
  },
  {
    id: "4",
    name: "Corporate Headshots",
    date: "2024-07-05",
    type: "Corporate",
    status: "pending",
    printCount: 1,
    images: [
      "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1441057206919-63d19fac2369?w=800&h=600&fit=crop",
    ],
    customerDetails: {
      name: "Tech Solutions Inc",
      location: "Office Building",
      date: "2024-07-05"
    }
  }
];

interface CounterStaffDashboardProps {
  username?: string;
}

export function CounterStaffDashboard({ username }: CounterStaffDashboardProps) {
  const [selectedSession, setSelectedSession] = useState<Session>(mockSessions[0]);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [zoom, setZoom] = useState(1);
  const { cartItems, addToCart } = useCart();
  const navigate = useNavigate();
  
  // Warning dialog states
  const [showSessionDeleteDialog, setShowSessionDeleteDialog] = useState(false);
  const [showPhotoDeleteDialog, setShowPhotoDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<{ sessionId: string; photoIndex: number } | null>(null);
  const [showCartWarningDialog, setShowCartWarningDialog] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  
  // Photo editor state
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ [sessionId: string]: number[] }>({});

  useEffect(() => {
    const stored = localStorage.getItem("orderedSessions");
    if (stored) {
      const orderedIds = JSON.parse(stored);
      setSessions(prev => prev.map(session =>
        orderedIds.includes(session.id)
          ? { ...session, status: "ordered" }
          : session
      ));
    }
  }, []);

  useEffect(() => {
    // Keep localStorage in sync if sessions change
    const orderedIds = sessions.filter(s => s.status === "ordered").map(s => s.id);
    localStorage.setItem("orderedSessions", JSON.stringify(orderedIds));
  }, [sessions]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("orderedSessions");
    window.location.href = "/";
  };

  // When logo is clicked, go back to last session (if any), else fallback to first session
  const handleBackToLastSession = () => {
    if (lastSession) {
      setSelectedSession(lastSession);
      setCurrentImageIndex(0);
    } else {
      setSelectedSession(sessions[0]);
      setCurrentImageIndex(0);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || session.date === selectedDate;
    const matchesStatus = !selectedStatus || session.status === selectedStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  const nextImage = () => {
    if (currentImageIndex < selectedSession.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // When a session is selected, remember the previous one as lastSession
  const handleSessionSelect = (session: Session) => {
    setLastSession(selectedSession); // store current before switching
    setSelectedSession(session);
    setCurrentImageIndex(0);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowSessionDeleteDialog(true);
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    
    const updatedSessions = sessions.filter(session => session.id !== sessionToDelete);
    setSessions(updatedSessions);
    
    if (selectedSession.id === sessionToDelete && updatedSessions.length > 0) {
      setSelectedSession(updatedSessions[0]);
      setCurrentImageIndex(0);
    }
    // If the deleted session was lastSession, clear it
    if (lastSession && lastSession.id === sessionToDelete) {
      setLastSession(null);
    }
    
    setShowSessionDeleteDialog(false);
    setSessionToDelete(null);
  };

  const getSessionIcon = (type: string) => {
    const icons = {
      "Family": "F",
      "Wedding": "W",
      "Graduation": "G",
      "Corporate": "C"
    };
    return icons[type as keyof typeof icons] || "S";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "ordered": "bg-blue-100 text-blue-800 border-blue-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleDeletePhoto = (sessionId: string, photoIndex: number) => {
    setPhotoToDelete({ sessionId, photoIndex });
    setShowPhotoDeleteDialog(true);
  };

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    
    const { sessionId, photoIndex } = photoToDelete;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const newImages = session.images.filter((_, i) => i !== photoIndex);
    const updatedSession = { ...session, images: newImages };
    
    setSelectedSession(updatedSession);
    
    // Also update in sessions state
    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return updatedSession;
      }
      return s;
    });
    setSessions(updatedSessions);
    
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
    
    setShowPhotoDeleteDialog(false);
    setPhotoToDelete(null);
  };

  const handleAddToCart = () => {
    const imageUrl = selectedSession.images[currentImageIndex];
    if (!imageUrl) return;
    // Compose a CartItem
    const cartItem = {
      id: `${selectedSession.id}-${currentImageIndex}`,
      name: `${selectedSession.name} - ${currentImageIndex + 1}`,
      thumb: imageUrl,
      editInfo: "", // Add edit info if available
      printSizes: [
        { label: "4x6", price: 2.99 },
        { label: "6x8", price: 4.99 },
      ],
      selectedSize: "4x6",
      quantity: 1,
    };
    // Prevent duplicate
    if (cartItems.some(item => item.id === cartItem.id)) {
      alert("This photo is already in your cart");
      return;
    }
    addToCart(cartItem);
    alert(`Added photo ${currentImageIndex + 1} from ${selectedSession.customerDetails.name} to cart`);
  };

  // Calculate the count of cart items (all sessions)
  const totalCartCount = cartItems.length;

  // Calculate total selected images across all sessions
  const totalSelectedCount = Object.values(selectedPhotos).reduce((sum, arr) => sum + arr.length, 0);

  // Fix the function name on line 306 - remove the space
  const handleProceedToCart = () => {
    if (totalSelectedCount === 0) {
      setShowCartWarningDialog(true);
      return;
    }

    // For each selected photo in each session, add to cart if not already present
    Object.entries(selectedPhotos).forEach(([sessionId, indices]) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        indices.forEach(imageIndex => {
          const cartItem = {
            id: `${sessionId}-${imageIndex}`,
            name: `${session.customerDetails.name} - Photo ${imageIndex + 1}`,
            thumb: session.images[imageIndex],
            editInfo: session.editedImages && 
              (session.editedImages instanceof Set 
                ? session.editedImages.has(imageIndex)
                : session.editedImages.includes(imageIndex)) ? "Edited" : "",
            printSizes: [
              { label: "4x6", price: 2.99 },
              { label: "6x8", price: 4.99 },
              { label: "8x10", price: 7.99 },
              { label: "11x14", price: 12.99 }
            ],
            selectedSize: "4x6",
            quantity: 1,
          };
          
          // Add to cart if not already present
          if (!cartItems.some(existingItem => existingItem.id === cartItem.id)) {
            addToCart(cartItem);
          }
        });
      }
    });
    
    // Clear selections after adding to cart
    setSelectedPhotos({});
    
    // Navigate to cart page
    navigate('/cart');
  };

  // Enhanced save handler to properly update all states
  const handleSaveEditedImage = (sessionId: string, imageIndex: number, editedImageUrl: string) => {
    try {
      // Update the sessions state with the edited image
      setSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => {
          if (session.id === sessionId) {
            const updatedImages = [...session.images];
            const originalImages = session.originalImages || [...session.images];
            
            // Store original images if not already stored
            if (!session.originalImages) {
              session.originalImages = [...session.images];
            }
            
            // Update the edited image
            updatedImages[imageIndex] = editedImageUrl;
            
            // Track which images are edited
            const editedImages = new Set(session.editedImages || []);
            editedImages.add(imageIndex);
            
            return {
              ...session,
              images: updatedImages,
              originalImages: originalImages,
              editedImages: editedImages,
              status: "ready" as const
            };
          }
          return session;
        });

        // Update selectedSession if it's the one being edited
        const updatedSelectedSession = updatedSessions.find(s => s.id === sessionId);
        if (updatedSelectedSession && selectedSession.id === sessionId) {
          setSelectedSession(updatedSelectedSession);
        }

        // Save to localStorage for persistence
        const serializableSessions = updatedSessions.map(session => ({
          ...session,
          editedImages: session.editedImages ? Array.from(session.editedImages) : []
        }));

        localStorage.setItem('photoKioskSessions', JSON.stringify(serializableSessions));

        return updatedSessions;
      });
      
      console.log(`Image ${imageIndex} for session ${sessionId} has been saved successfully`);
      
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Failed to save the edited image. Please try again.');
    }
  };

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('photoKioskSessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert editedImages array to Set
        const sessionsWithSets = parsedSessions.map((session: any) => ({
          ...session,
          editedImages: new Set(session.editedImages || [])
        }));
        setSessions(sessionsWithSets);
        
        // Update selectedSession if it exists in the loaded sessions
        if (selectedSession) {
          const updatedSelectedSession = sessionsWithSets.find((s: any) => s.id === selectedSession.id);
          if (updatedSelectedSession) {
            setSelectedSession(updatedSelectedSession);
          }
        }
      } catch (error) {
        console.error('Error loading sessions from localStorage:', error);
      }
    }
  }, []);

  const handleDeleteImage = (sessionId: string, imageIndex: number) => {
    try {
      // Update the sessions state by removing the image
      setSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === sessionId) {
            const updatedImages = session.images.filter((_, index) => index !== imageIndex);
            const updatedOriginalImages = session.originalImages?.filter((_, index) => index !== imageIndex);
            
            // Update edited images indices (shift down indices that are higher than deleted index)
            const updatedEditedImages = new Set<number>();
            if (session.editedImages) {
              session.editedImages.forEach(editedIndex => {
                if (editedIndex < imageIndex) {
                  updatedEditedImages.add(editedIndex);
                } else if (editedIndex > imageIndex) {
                  updatedEditedImages.add(editedIndex - 1);
                }
                // Skip the deleted index
              });
            }
            
            return {
              ...session,
              images: updatedImages,
              originalImages: updatedOriginalImages,
              editedImages: updatedEditedImages
            };
          }
          return session;
        })
      );

      // Update selectedSession if it's the affected session
      if (selectedSession.id === sessionId) {
        const updatedImages = selectedSession.images.filter((_, index) => index !== imageIndex);
        setSelectedSession({
          ...selectedSession,
          images: updatedImages
        });
        
        // Adjust currentImageIndex if necessary
        if (currentImageIndex >= updatedImages.length) {
          setCurrentImageIndex(Math.max(0, updatedImages.length - 1));
        }
      }

      // Save to localStorage for persistence
      const updatedSessions = sessions.map(session => {
        if (session.id === sessionId) {
          const updatedImages = session.images.filter((_, index) => index !== imageIndex);
          const updatedOriginalImages = session.originalImages?.filter((_, index) => index !== imageIndex);
          
          const updatedEditedImages = new Set<number>();
          if (session.editedImages) {
            session.editedImages.forEach(editedIndex => {
              if (editedIndex < imageIndex) {
                updatedEditedImages.add(editedIndex);
              } else if (editedIndex > imageIndex) {
                updatedEditedImages.add(editedIndex - 1);
              }
            });
          }
          
          return {
            ...session,
            images: updatedImages,
            originalImages: updatedOriginalImages,
            editedImages: updatedEditedImages
          };
        }
        return session;
      });

      // Convert Set to Array for localStorage (Set is not serializable)
      const serializableSessions = updatedSessions.map(session => ({
        ...session,
        editedImages: session.editedImages ? Array.from(session.editedImages) : []
      }));

      localStorage.setItem('photoKioskSessions', JSON.stringify(serializableSessions));
      
      console.log(`Image ${imageIndex} for session ${sessionId} has been deleted successfully`);
      
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete the image. Please try again.');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-border p-4 flex justify-between items-center shadow-sm flex-shrink-0">
        <button 
          onClick={handleBackToLastSession}
          className="flex items-center gap-3 text-green-600 hover:text-green-800 transition-all duration-200 group"
          aria-label="Back"
          title="Back"
        >
          <ChevronLeft className="h-6 w-6 invisible" />
          <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Photo Kiosk</span>
        </button>
        
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="text-left bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 px-3 lg:px-4 py-2 rounded-lg shadow-sm border border-green-200 dark:border-slate-600">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm lg:text-base">{username || "Counter Staff"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{new Date().toLocaleDateString()}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 lg:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm lg:text-base"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <div className="w-72 lg:w-80 bg-white dark:bg-slate-800 border-r border-border p-4 lg:p-6 flex flex-col flex-shrink-0 min-w-0 group">
          <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Customer Sessions</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Filter */}
          <div className="relative mb-4">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="mb-6 relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ordered">Ordered</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          {/* Sessions List - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 mb-4 min-h-0 min-w-0 session-scrollbar">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionSelect(session)}
                className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-105 min-w-0 max-w-full
                  ${selectedSession.id === session.id
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border border-green-300 shadow-md"
                    : "bg-muted/50 hover:bg-muted border border-transparent"}
                `}
                style={{ boxSizing: 'border-box' }}
              >
                <div className="flex items-center gap-3 min-w-0 max-w-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-border flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {getSessionIcon(session.type)}
                  </div>
                  <div className="flex-1 min-w-0 max-w-full">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-sm truncate max-w-full">{session.customerDetails.name}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${getStatusColor(session.status)}`}
                        style={{ minWidth: 70, justifyContent: 'center', letterSpacing: '0.01em' }}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{session.date}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="p-1 h-auto hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 min-w-0">
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Main Image Area - Optimized space */}
            <div className="flex-1 p-4 flex flex-col relative min-w-0">
              {/* Customer name and date - compact header */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedSession.customerDetails.name}</h2>
                  <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(selectedSession.status)}`}>{selectedSession.status}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 text-center">{selectedSession.date}</p>
              </div>
              
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden flex items-center justify-center flex-1 min-h-0 pl-16 pb-16">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {selectedSession.images.length === 0 ? (
                    <span className="text-gray-400">No images available</span>
                  ) : (
                    <div
                      className="relative flex items-center justify-center bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden"
                      style={{
                        width: '100%',
                        maxWidth: 'min(800px, 90vw)',
                        aspectRatio: '4/3',
                        minHeight: '300px',
                        maxHeight: 'min(70vh, 600px)',
                      }}
                    >
                      {/* Left navigation button inside canvas */}
                      {selectedSession.images.length > 1 && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute"
                          style={{
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            borderRadius: '9999px',
                            background: 'linear-gradient(to right, #22c55e, #10b981)',
                            color: 'white',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                            zIndex: 40,
                          }}
                          onClick={prevImage}
                          disabled={currentImageIndex === 0}
                        >
                          <ChevronLeft className="h-6 w-6 text-white" />
                        </Button>
                      )}
                      {/* Right navigation button inside canvas */}
                      {selectedSession.images.length > 1 && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute"
                          style={{
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            borderRadius: '9999px',
                            background: 'linear-gradient(to right, #22c55e, #10b981)',
                            color: 'white',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                            zIndex: 40,
                          }}
                          onClick={nextImage}
                          disabled={currentImageIndex === selectedSession.images.length - 1}
                        >
                          <ChevronRight className="h-6 w-6 text-white" />
                        </Button>
                      )}
                      <img
                        src={selectedSession.images[currentImageIndex]}
                        alt="Session photo"
                        style={{
                          maxWidth: '90%',
                          maxHeight: '90%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block',
                          background: 'transparent',
                          borderRadius: '1rem',
                        }}
                        loading="eager"
                        onError={(e) => {
                          // If image fails, try next image or show fallback
                          const newImages = selectedSession.images.filter((_, i) => i !== currentImageIndex);
                          if (newImages.length > 0) {
                            setSelectedSession({ ...selectedSession, images: newImages });
                            setCurrentImageIndex(0);
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Enhanced Thumbnails */}
            <div className="w-72 lg:w-80 p-4 border-l border-border bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 overflow-y-auto flex-shrink-0">
              <h3 className="text-base font-bold mb-4 text-slate-800 dark:text-white">Photos ({selectedSession.images.length})</h3>
              
              {/* Action Buttons */}
              <div className="mb-4 space-y-2">
                <Button
                  onClick={() => setShowPhotoEditor(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Photos
                </Button>
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                {selectedSession.images.map((image, index) => {
                  const isSelected = (selectedPhotos[selectedSession.id] || []).includes(index);
                  const isEdited = selectedSession.editedImages && 
                    (selectedSession.editedImages instanceof Set 
                      ? selectedSession.editedImages.has(index)
                      : selectedSession.editedImages.includes(index));
                  

                  return (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-green-400 bg-green-50 ring-1 ring-green-200"
                          : "border-gray-200 bg-white shadow"
                      }`}
                    >
                      {/* Static tick box for selection */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedPhotos((prev) => {
                            const current = prev[selectedSession.id] || [];
                            if (current.includes(index)) {
                              // Deselect
                              return { ...prev, [selectedSession.id]: current.filter(i => i !== index) };
                            } else {
                              // Select
                              return { ...prev, [selectedSession.id]: [...current, index] };
                            }
                          });
                        }}
                        className="absolute top-1 left-1 z-10 w-5 h-5 accent-green-500 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-green-400 cursor-pointer"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                      />
                      {/* Edited Badge */}
                      {isEdited && (
                        <div className="absolute top-1 left-7 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          <span>Edited</span>
                        </div>
                      )}

                      {/* Image */}
                      <div className="w-full h-24 lg:h-32 aspect-[4/3] flex items-center justify-center rounded-lg overflow-hidden relative">
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover bg-transparent rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            // Error handling for broken images
                            const newImages = selectedSession.images.filter((_, i) => i !== index);
                            setSelectedSession({ ...selectedSession, images: newImages });
                            
                            const updatedSessions = sessions.map(session => {
                              if (session.id === selectedSession.id) {
                                return { ...session, images: newImages };
                              }
                              return session;
                            });
                            setSessions(updatedSessions);
                            
                            if ((selectedPhotos[selectedSession.id] || []).includes(index)) {
                              setSelectedPhotos(prev => ({
                                ...prev,
                                [selectedSession.id]: (prev[selectedSession.id] || []).filter(i => i !== index)
                              }));
                            }
                            if (currentImageIndex >= newImages.length) {
                              setCurrentImageIndex(Math.max(0, newImages.length - 1));
                            }
                          }}
                        />
                      </div>
                      <button
                        className="absolute top-1 right-1 bg-white/80 hover:bg-red-100 text-red-600 rounded-full p-1 shadow"
                        style={{ zIndex: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(selectedSession.id, index);
                        }}
                        title="Delete image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Session Delete Warning Dialog */}
        <AlertDialog open={showSessionDeleteDialog} onOpenChange={setShowSessionDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be undone and will permanently remove all photos and customer details associated with this session.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteSession}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Photo Delete Warning Dialog */}
        <AlertDialog open={showPhotoDeleteDialog} onOpenChange={setShowPhotoDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this photo? This action cannot be undone and will permanently remove the photo from this session.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeletePhoto}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Photo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cart Empty Warning Dialog */}
        <AlertDialog open={showCartWarningDialog} onOpenChange={setShowCartWarningDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cart is Empty</AlertDialogTitle>
              <AlertDialogDescription>
                Please add at least one photo to cart before proceeding.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowCartWarningDialog(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cart Dialog for current session */}
        <AlertDialog open={showCartDialog} onOpenChange={setShowCartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selected Photos in This Session</AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const currentSessionCart = cartItems.filter(item => item.id.startsWith(`${selectedSession.id}-`));
                  if (currentSessionCart.length === 0) {
                    return <span>No photos from this session are in your cart.</span>;
                  }
                  return (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {currentSessionCart.map((item, idx) => (
                        <img
                          key={item.id}
                          src={item.thumb}
                          alt={`Selected photo ${idx + 1}`}
                          className="w-20 h-16 object-cover rounded shadow border"
                        />
                      ))}
                    </div>
                  );
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowCartDialog(false)}>
                Close
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  setShowCartDialog(false);
                  alert('Cart confirmed!');
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Add Proceed to Cart button fixed at bottom right */}
      <button
        onClick={handleProceedToCart}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-full shadow-lg text-lg transition-all"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
        disabled={totalSelectedCount === 0}
      >
        <ShoppingCart className="h-6 w-6" />
        Proceed to Cart ({totalSelectedCount})
      </button>

      {/* Photo Editor */}
      {showPhotoEditor && selectedSession && (
        <PhotoEditor
          session={{
            ...selectedSession,
            editedImages: selectedSession.editedImages ? Array.from(selectedSession.editedImages) : []
          }}
          onClose={() => setShowPhotoEditor(false)}
          onSave={handleSaveEditedImage}
          onDeleteImage={handleDeleteImage}
          initialSelectedIndex={currentImageIndex}
        />
      )}
    </div>
  );
}