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
import { MapPin, Shield, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import HotelSection from "./HotelSection";




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
  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${apiBase}/rooms/hotel/${hotelId}`);
      setRoomsData(res.data);
      setRoomsError(null);
    } catch (err: any) {
      setRoomsError(err.response?.data?.message || "Failed to fetch rooms");
    } finally {
      setRoomsLoading(false);
    }
  };





  





  useEffect(() => {
    fetchRooms();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRooms();
    }, 30000);

    return () => clearInterval(interval);
  }, [hotelId]);

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
        fetchRooms();
      }
    });

    newSocket.on('roomUpdated', (data) => {
      if (data.hotelId === hotelId) {
        toast({
          title: "Room updated!",
          description: "Room information has been updated.",
        });
        fetchRooms();
      }
    });

    newSocket.on('roomDeleted', (data) => {
      if (data.hotelId === hotelId) {
        toast({
          title: "Room removed!",
          description: "A room has been removed from inventory.",
        });
        fetchRooms();
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






            {/* Hotel Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-premium">
                  Reservation Policy and Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-luxury mt-1" />
                    <div>
                      <h4 className="font-semibold">Cancellation Policy</h4>
                      <p className="text-sm text-muted-foreground">
                        Free cancellation up to 24 hours before check-in. After that, one night's charge applies.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-luxury mt-1" />
                    <div>
                      <h4 className="font-semibold">Check-in/out</h4>
                      <p className="text-sm text-muted-foreground">
                        Check-in: 3:00 PM | Check-out: 12:00 PM. Early check-in subject to availability.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-luxury mt-1" />
                    <div>
                      <h4 className="font-semibold">Guest Policy</h4>
                      <p className="text-sm text-muted-foreground">
                        Maximum occupancy as specified per room. Additional guests may incur extra charges.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-luxury mt-1" />
                    <div>
                      <h4 className="font-semibold">Location</h4>
                      <p className="text-sm text-muted-foreground">
                        Centrally located in Friends Colony with easy access to major attractions and business districts.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

   



<HotelSection />







            


            
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
      </div>
    </div>
  );
};
