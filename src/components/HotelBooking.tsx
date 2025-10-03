import { useState, useEffect } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import HotelHeader from "./HotelHeader";
import { SearchBar } from "./SearchBar";
import { ReservationSummary } from "./ReservationSummary";
import { RoomCard } from "./RoomCard";
import { GuestForm } from "./GuestForm";
import { PaymentSection } from "./PaymentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Shield, Clock, Users, Camera, Map, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";






interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}

interface Room {
  _id?: string;
  hotel?: string;
  type?: string;
  roomDescription?: string;
  totalRooms?: number;
  pricePerNight?: number;
  bedType?: string;
  perAdultPrice?: number;
  perChildPrice?: number;
  discount?: number;
  taxPercentage?: number;
  maxGuests?: number;
  roomSize?: string;
  availability?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  availableCount?: number;
}

export const HotelBooking = () => {









  
  const { toast } = useToast();
  
  // Search state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  
  // Booking state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });




  const [paymentMethod, setPaymentMethod] = useState("");


const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);  


  
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string>("");

  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [roomsData, setRoomsData] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [unavailableRooms, setUnavailableRooms] = useState<Room[]>([]);
  const [soldOutRooms, setSoldOutRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);



  // Calculate max available rooms
  const maxAvailableRooms = Math.max(...roomsData.map(r => r.availableCount || 0), 0);

  // Use the same hotelId as in HotelHeader
  const hotelId = import.meta.env.VITE_HOTEL_ID;

  const apiBase = import.meta.env.VITE_API_BASE;

  // Generate confirmation ID function
  const generateConfirmationId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Function to fetch rooms data
  const fetchRooms = async (checkInDate?: string, checkOutDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (checkInDate) params.append('checkIn', checkInDate);
      if (checkOutDate) params.append('checkOut', checkOutDate);

      const res = await axios.get(`${apiBase}/rooms/hotel/${hotelId}`, { params });
      setRoomsData(res.data);
      setRoomsError(null);
    } catch (err: any) {
      setRoomsError(err.response?.data?.message || "Failed to fetch rooms");
    } finally {
      setRoomsLoading(false);
    }
  };





  





  useEffect(() => {
    if (checkIn && checkOut) {
      fetchRooms(checkIn, checkOut);
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (checkIn && checkOut) {
        fetchRooms(checkIn, checkOut);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hotelId, checkIn, checkOut, lastUpdated]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const newSocket = io(apiBase);
    setSocket(newSocket);

    // Listen for room updates
    newSocket.on('roomCreated', (data) => {
      if (data.hotelId === hotelId) {
        toast({
          title: "New room added!",
          description: "Room inventory has been updated.",
        });
        setLastUpdated(Date.now());
      }
    });

    newSocket.on('roomUpdated', (data) => {
      if (data.hotelId === hotelId) {
        toast({
          title: "Room updated!",
          description: "Room information has been updated.",
        });
        setLastUpdated(Date.now());
      }
    });

    newSocket.on('roomDeleted', (data) => {
      if (data.hotelId === hotelId) {
        toast({
          title: "Room removed!",
          description: "A room has been removed from inventory.",
        });
        setLastUpdated(Date.now());
      }
    });

    return () => {
      newSocket.close();
    };
  }, [hotelId, apiBase]);

  useEffect(() => {
    const totalGuests = adults + children;
    const availableRooms = roomsData.filter(
      (room) => room.availability === "Available" && room.maxGuests >= totalGuests && (room.availableCount || 0) >= rooms
    );
    const unavailableRooms = roomsData.filter(
      (room) => room.availability === "Available" && room.maxGuests >= totalGuests && (room.availableCount || 0) < rooms && (room.availableCount || 0) > 0
    );
    const soldOutRooms = roomsData.filter(
      (room) => room.availability === "Available" && room.maxGuests >= totalGuests && (room.availableCount || 0) === 0
    );
    setFilteredRooms(availableRooms);
    setUnavailableRooms(unavailableRooms);
    setSoldOutRooms(soldOutRooms);
  }, [roomsData, adults, children, rooms]);

  const calculateNights = () => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 1;
  };

  const nights = calculateNights();
  const roomPrice = selectedRoom?.pricePerNight || 0;
  
  // Calculate room charges (same logic as ReservationSummary)
  const roomCharges = roomPrice * nights * rooms;
  
  // Calculate guest charges (same logic as ReservationSummary)
  const adultCharges = selectedRoom
    ? adults * (selectedRoom.perAdultPrice || 0)
    : 0;
  const childCharges = selectedRoom
    ? children * (selectedRoom.perChildPrice || 0)
    : 0;
  const guestCharges = adultCharges + childCharges;
  
  // Calculate subtotal (room + guest charges)
  const subtotal = roomCharges + guestCharges;
  
  // Calculate taxes using room's tax percentage (same logic as ReservationSummary)
  const taxPercentage = selectedRoom?.taxPercentage || 18;
  const taxes = Math.round(subtotal * (taxPercentage / 100));
  
  // Calculate grand total
  const discount = 0;
  const total = subtotal + taxes - discount;

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      toast({
        title: "Please select dates",
        description: "Check-in and check-out dates are required",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Searching rooms...",
      description: "Finding the best available rooms for your dates",
    });
    setRoomsLoading(true);
    fetchRooms(checkIn, checkOut);
  };

  const handleBookNow = (roomId: string) => {
    const room = roomsData.find(r => r._id === roomId);
    if (room) {
      setSelectedRoom(room);
      document.getElementById('guest-form')?.scrollIntoView({ behavior: 'smooth' });
      toast({
        title: "Room selected!",
        description: `${room.type} has been selected. Please fill in your details below.`,
      });
    }
  };





  
  
  
  const handleMakePayment = async () => {
    // Validate guest info
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !guestInfo[field as keyof GuestInfo]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: "All guest information fields are required for booking",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoom) {
      toast({
        title: "Please select a room",
        description: "You need to select a room before making payment",
        variant: "destructive",
      });
      return;
    }

    if (!paymentProofFile) {
      toast({
        title: "Please upload payment proof",
        description: "Payment proof image is required to confirm the booking",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Guest Details
      formData.append('guestDetails', JSON.stringify({
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        email: guestInfo.email,
        phone: guestInfo.phone,
        city: guestInfo.city,
        country: guestInfo.country
      }));

      // Selected Room Details
      formData.append('roomDetails', JSON.stringify({
        roomId: selectedRoom._id || '',
        roomType: selectedRoom.type || '',
        pricePerNight: selectedRoom.pricePerNight || 0,
        maxGuests: selectedRoom.maxGuests || 0,
        bedType: selectedRoom.bedType || '',
        roomSize: selectedRoom.roomSize || ''
      }));

      // Booking Details
      formData.append('bookingDetails', JSON.stringify({
        checkIn: checkIn,
        checkOut: checkOut,
        numberOfRooms: rooms,
        numberOfAdults: adults,
        numberOfChildren: children,
        numberOfNights: nights,
        hotelId: hotelId
      }));

      // Amount Details
      formData.append('amountDetails', JSON.stringify({
        roomCharges: roomCharges,
        guestCharges: guestCharges,
        subtotal: subtotal,
        taxesAndFees: taxes,
        discount: discount,
        grandTotal: total,
        currency: 'INR'
      }));

      // Payment Details
      formData.append('paymentDetails', JSON.stringify({
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: 'pending',
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentDate: new Date().toISOString()
      }));

      // Payment Proof Image
      formData.append('paymentProof', paymentProofFile);

      // Additional metadata
      const frontendConfirmationId = generateConfirmationId();
      formData.append('bookingMetadata', JSON.stringify({
        bookingDate: new Date().toISOString(),
        bookingSource: 'web',
        userAgent: navigator.userAgent,
        ipAddress: 'unknown', // This would typically be handled by the backend
        frontendConfirmationId: frontendConfirmationId
      }));

      // Backend API call
      const response = await axios.post(`${apiBase}/guests/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      // Success handling
      const receivedConfirmationId = response.data.confirmationId || response.data.bookingId || response.data.id || frontendConfirmationId;
      setConfirmationId(receivedConfirmationId);
      
      toast({
        title: "🎉 Booking Confirmed!",
        description: `Your reservation has been confirmed! Confirmation ID: ${receivedConfirmationId}`,
      });

      // Reset form after successful booking
      setSelectedRoom(null);
      setGuestInfo({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        country: "",
      });
      setPaymentMethod("");
      setPaymentProofFile(null);
      setCheckIn("");
      setCheckOut("");
      setRooms(1);
      setAdults(2);
      setChildren(0);

    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Enhanced error handling
      let errorMessage = "There was an error processing your booking. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: "Booking failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  
  
  
  
  
  
  
  
  
  
  
  
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
  }, []);



console.log(guestInfo);





  return (
    <div className="min-h-screen bg-background">
      <HotelHeader />
      
      <div className="container mx-auto px-4 py-6">
        <SearchBar
          checkIn={checkIn}
          checkOut={checkOut}
          rooms={rooms}
          adults={adults}
          children={children}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onRoomsChange={setRooms}
          onAdultsChange={setAdults}
          onChildrenChange={setChildren}
          onSearch={handleSearch}
          maxRooms={maxAvailableRooms}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Room listings */}
            <div className="space-y-4">
              {roomsLoading ? (
                <div>Loading rooms...</div>
              ) : roomsError ? (
                <div>{roomsError}</div>
              ) : (filteredRooms.length > 0 || unavailableRooms.length > 0 || soldOutRooms.length > 0) ? (
                <>
                  {/* Available Rooms */}
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      id={room._id}
                      name={room.type}
                      image={room.image ? room.image : ""}
                      description={`Room Size: ${room.roomSize || "N/A"}`}
                      roomDescription={room.roomDescription || ""}
                      price={room.pricePerNight}
                      originalPrice={room.discount ? room.pricePerNight + room.discount : undefined}
                      features={[]}
                      capacity={room.maxGuests}
                      bedType={room.bedType}
                      isPopular={true}
                      availableCount={room.availableCount}
                      isUnavailable={false}
                      isSoldOut={false}
                      onBookNow={handleBookNow}
                    />
                  ))}

                  {/* Limited Availability Rooms */}
                  {unavailableRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      id={room._id}
                      name={room.type}
                      image={room.image ? room.image : ""}
                      description={`Room Size: ${room.roomSize || "N/A"}`}
                      roomDescription={room.roomDescription || ""}
                      price={room.pricePerNight}
                      originalPrice={room.discount ? room.pricePerNight + room.discount : undefined}
                      features={[]}
                      capacity={room.maxGuests}
                      bedType={room.bedType}
                      isPopular={true}
                      availableCount={room.availableCount}
                      isUnavailable={true}
                      isSoldOut={false}
                    />
                  ))}

                  {/* Sold Out Rooms */}
                  {soldOutRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      id={room._id}
                      name={room.type}
                      image={room.image ? room.image : ""}
                      description={`Room Size: ${room.roomSize || "N/A"}`}
                      roomDescription={room.roomDescription || ""}
                      price={room.pricePerNight}
                      originalPrice={room.discount ? room.pricePerNight + room.discount : undefined}
                      features={[]}
                      capacity={room.maxGuests}
                      bedType={room.bedType}
                      isPopular={true}
                      availableCount={room.availableCount}
                      isUnavailable={false}
                      isSoldOut={true}
                    />
                  ))}
                </>
              ) : (
                <div>No rooms available for the selected criteria.</div>
              )}

              {/* Show message if no fully available rooms */}
              {!roomsLoading && !roomsError && roomsData.length > 0 &&
               filteredRooms.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {maxAvailableRooms < rooms ? "Insufficient Room Availability" : "No Fully Available Rooms"}
                  </h3>
                  <p className="text-gray-600">
                    {maxAvailableRooms < rooms
                      ? `Only ${maxAvailableRooms} rooms left. Please reduce the number of rooms.`
                      : "No rooms are fully available. You may still see rooms with limited availability above - contact the hotel to check specific availability."
                    }
                  </p>
                </div>
              )}
            </div>








            {/* Payment Section */}
            {selectedRoom && (
              <PaymentSection
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onMakePayment={handleMakePayment}
                isProcessing={isProcessing}
                total={total}
              />
            )}


            {/* Guest Form */}
            {selectedRoom && (
              <div id="guest-form">
                <GuestForm
                  guestInfo={guestInfo}
                  onGuestInfoChange={setGuestInfo}
                  paymentProofFile={paymentProofFile}
                  onPaymentProofChange={setPaymentProofFile}
                />
              </div>
            )}






            {/* Hotel Information Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-premium">
                  Hotel Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="gallery" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="gallery" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photo Gallery
                    </TabsTrigger>
                    <TabsTrigger value="property" className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Property Info
                    </TabsTrigger>
                    <TabsTrigger value="facilities" className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Facilities
                    </TabsTrigger>
                    <TabsTrigger value="location" className="flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Location
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gallery" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        "/assets/deluxe-room.jpg",
                        "/assets/executive-room.jpg",
                        "/assets/manor-suite.jpg",
                        "/assets/signature-room.jpg",
                        "/assets/standard-room.jpg",
                        "/assets/studio-suite.jpg"
                      ].map((image, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`Hotel gallery image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="property" className="mt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Hotel Overview</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hotel Type:</span>
                              <span className="font-medium">Boutique Hotel</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Established:</span>
                              <span className="font-medium">2015</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Rooms:</span>
                              <span className="font-medium">25</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rating:</span>
                              <span className="font-medium">4.5/5</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Services</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>24/7 Front Desk</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Room Service</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Laundry Service</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Concierge</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="facilities" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Room Facilities</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            "24/7 Hot water",
                            "AC",
                            "Attached Bathroom",
                            "Cable TV",
                            "Direct Phone",
                            "Double/Twin Beds",
                            "High speed WiFi internet",
                            "Iron with ironing board (on request)",
                            "LCD TV",
                            "Smoke Detector Alarms",
                            "Tea/Coffee Maker",
                            "24/7 room service"
                          ].map((facility, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{facility}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Hotel Facilities</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {[
                            "Complimentary Packaged Water Bottles",
                            "Direct-Dialing Phone",
                            "Hair Dryer",
                            "High Speed Wi-Fi Internet(chargable)",
                            "Kettle",
                            "Marble Flooring",
                            "Shower",
                            "Sound proof windows",
                            "Study Table",
                            "Work Desk",
                            "Complimentary toiletries",
                            "Internet"
                          ].map((facility, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{facility}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="mt-6">
                    <div className="space-y-4">
                      <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Interactive Map</p>
                          <p className="text-sm text-gray-500">12°16'48.8"N 79°04'16.7"E</p>
                          <p className="text-sm text-gray-500">Tamil Nadu, Tiruvannamalai</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold mb-2">Address</h4>
                          <p className="text-muted-foreground">
                            Friends Colony<br />
                            Tiruvannamalai, Tamil Nadu<br />
                            India - 606601
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Nearby Attractions</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <p>• Arunachaleswarar Temple (2.5 km)</p>
                            <p>• Girivalam Path (1.8 km)</p>
                            <p>• Ramana Ashram (3.2 km)</p>
                            <p>• Local Market (1.2 km)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

   













          </div>




          {/* Reservation Summary Sidebar */}
          <div className="lg:col-span-1">
            <ReservationSummary
              roomPrice={roomPrice}
              nights={nights}
              discount={discount}
              roomCount={rooms}
              selectedRoom={selectedRoom}
              guestInfo={guestInfo}
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              children={children}
              paymentMethod={paymentMethod}
              paymentProofFile={paymentProofFile}
              hotelId={hotelId}
            />



         
          </div>






          


          
        </div>

        {/* Reservation Policy and Terms & Conditions - Bottom Section */}
        <div className="mt-12 pt-8 border-t">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-premium flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Reservation Policy and Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-luxury mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base mb-2">Cancellation Policy</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Free cancellation up to 24 hours before check-in</p>
                        <p>• After that, one night's charge applies</p>
                        <p>• No-show will result in full payment</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-luxury mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base mb-2">Check-in/Check-out</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Check-in: 3:00 PM</p>
                        <p>• Check-out: 12:00 PM</p>
                        <p>• Early check-in subject to availability</p>
                        <p>• Late check-out may incur extra charges</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-luxury mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base mb-2">Guest Policy</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Maximum occupancy as specified per room</p>
                        <p>• Additional guests may incur extra charges</p>
                        <p>• Valid ID required at check-in</p>
                        <p>• Children under 12 stay free with parents</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-luxury mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-base mb-2">Location & Access</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Centrally located in Friends Colony</p>
                        <p>• Easy access to major attractions</p>
                        <p>• Business districts nearby</p>
                        <p>• Public transport available</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base">Payment Terms</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Full payment required for booking confirmation</p>
                      <p>• All major credit cards accepted</p>
                      <p>• UPI and digital payments supported</p>
                      <p>• Payment proof required for verification</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-base">Additional Policies</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• No pets allowed</p>
                      <p>• Smoking prohibited in rooms</p>
                      <p>• Outside visitors must register</p>
                      <p>• Damage charges apply for violations</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base">Contact Information</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Phone: +91-XXXX-XXXXXX</p>
                      <p>• Email: info@sonachalahotel.com</p>
                      <p>• 24/7 Front Desk Support</p>
                      <p>• Emergency contact available</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">Need Help?</p>
                    <p className="text-sm text-blue-600">
                      For any questions about our policies or special requests,
                      please contact our guest relations team.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="text-center text-sm text-muted-foreground">
                  <p className="mb-2">
                    By proceeding with your booking, you agree to our Terms & Conditions and Privacy Policy.
                  </p>
                  <p>
                    All bookings are subject to availability and hotel confirmation.
                    Rates are subject to change without prior notice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
