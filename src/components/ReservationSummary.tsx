import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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
  commission?: number;
  maxGuests?: number;
  roomSize?: string;
  availability?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ReservationSummaryProps {
  roomPrice: number;
  nights: number;
  discount: number;
  roomCount: number;
  // Booking data props
  selectedRoom: Room | null;
  guestInfo: GuestInfo;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  paymentMethod: string;
  paymentProofFile: File | null;
  hotelId: string;
}

export const ReservationSummary = ({
  roomPrice,
  nights,
  discount,
  roomCount,
  selectedRoom,
  guestInfo,
  checkIn,
  checkOut,
  adults,
  children,
  paymentMethod,
  paymentProofFile,
  hotelId,
}: ReservationSummaryProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");




  const apiBase = import.meta.env.VITE_API_BASE;



  // Calculate room charges
  const roomCharges = roomPrice * nights * roomCount;

  // Calculate guest charges
  const adultCharges = selectedRoom
    ? adults * (selectedRoom.perAdultPrice || 0)
    : 0;
  const childCharges = selectedRoom
    ? children * (selectedRoom.perChildPrice || 0)
    : 0;
  const guestCharges = adultCharges + childCharges;

  // Calculate subtotal (room + guest charges)
  const subtotal = roomCharges + guestCharges;

  // Calculate taxes using room's tax percentage
  const taxPercentage = selectedRoom?.taxPercentage || 18;
  const taxes = Math.round(subtotal * (taxPercentage / 100));

  // Calculate commission using room's commission percentage
  const commissionPercentage = selectedRoom?.commission || 0;
  const commission = Math.round(subtotal * (commissionPercentage / 100));

  // Calculate grand total
  const total = subtotal + taxes + commission - discount;

  const handleProceedToPay = async () => {
    // Validate required data
    if (!selectedRoom) {
      toast({
        title: "Please select a room",
        description: "You need to select a room before proceeding to payment",
        variant: "destructive",
      });
      return;
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) => !guestInfo[field as keyof GuestInfo]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: "All guest information fields are required for booking",
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
      formData.append(
        "guestDetails",
        JSON.stringify({
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone,
          city: guestInfo.city,
          country: guestInfo.country,
        })
      );

      // Selected Room Details
      formData.append(
        "roomDetails",
        JSON.stringify({
          roomId: selectedRoom._id || "",
          roomType: selectedRoom.type || "",
          pricePerNight: selectedRoom.pricePerNight || 0,
          maxGuests: selectedRoom.maxGuests || 0,
          bedType: selectedRoom.bedType || "",
          roomSize: selectedRoom.roomSize || "",
        })
      );

      // Booking Details
      formData.append(
        "bookingDetails",
        JSON.stringify({
          checkIn: checkIn,
          checkOut: checkOut,
          numberOfRooms: roomCount,
          numberOfAdults: adults,
          numberOfChildren: children,
          numberOfNights: nights,
          hotelId: hotelId,
        })
      );

      // Amount Details
      formData.append(
        "amountDetails",
        JSON.stringify({
          roomCharges: roomCharges,
          guestCharges: guestCharges,
          subtotal: subtotal,
          taxesAndFees: taxes,
          discount: discount,
          grandTotal: total,
          currency: "INR",
        })
      );

      // Payment Details
      formData.append(
        "paymentDetails",
        JSON.stringify({
          paymentMethod: paymentMethod || "UPI",
          paymentStatus: "pending",
          transactionId: `TXN_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          paymentDate: new Date().toISOString(),
        })
      );

      console.log(formData);

      // Payment Proof Image
      formData.append("paymentProof", paymentProofFile);

      // Additional metadata
      formData.append(
        "bookingMetadata",
        JSON.stringify({
          bookingDate: new Date().toISOString(),
          bookingSource: "web",
          userAgent: navigator.userAgent,
          ipAddress: "unknown",
        })
      );

      // Log FormData contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

    

      // Backend API call
      const response = await axios.post(
        `${apiBase}/bookings`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000,
        }
      );

      console.log(formData);

      // Success handling
      const confirmationId =
        response.data.confirmationId ||
        response.data.bookingId ||
        response.data.id ||
        Date.now().toString().slice(-6);
      setBookingId(confirmationId);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Booking error:", error);

      // Enhanced error handling
      let errorMsg =
        "There was an error processing your booking. Please try again.";

      if (error.response) {
        errorMsg =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMsg;
      } else if (error.request) {
        errorMsg =
          "Unable to connect to the server. Please check your internet connection.";
      } else {
        errorMsg = error.message || errorMsg;
      }

      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="sticky top-6 h-fit">
        <CardHeader className="bg-gradient-to-r from-luxury/10 to-luxury/5">
          <CardTitle className="text-xl font-bold text-premium">
            Reservation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Room Rate</span>
              <span className="font-medium">₹{roomPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Number of Rooms</span>
              <span className="font-medium">{roomCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Number of Nights</span>
              <span className="font-medium">{nights}</span>
            </div>

            {/* Guest Count Details */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Guests</span>
                <span className="text-sm font-medium">
                  {adults + children} Total
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Adults: {adults}</span>
                <span>₹{selectedRoom?.perAdultPrice || 0} each</span>
              </div>
              {children > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Children: {children}</span>
                  <span>₹{selectedRoom?.perChildPrice || 0} each</span>
                </div>
              )}

              {/* Guest Charges Breakdown */}
              {selectedRoom && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span>
                      Adult charges ({adults} × ₹{selectedRoom.perAdultPrice})
                    </span>
                    <span>₹{adultCharges.toLocaleString()}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Child charges ({children} × ₹
                        {selectedRoom.perChildPrice})
                      </span>
                      <span>₹{childCharges.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Room Charges</span>
              <span className="font-medium">
                ₹{roomCharges.toLocaleString()}
              </span>
            </div>

            {guestCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-sm">Guest Charges</span>
                <span className="font-medium">
                  ₹{guestCharges.toLocaleString()}
                </span>
              </div>
            )}

            <hr className="border-2 border-dark" />

            <div className="flex justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString()}</span>
            </div>

            <hr className="border-2 border-dark" />

            <div className="flex justify-between">
              <span className="text-sm">Taxes & Fees ({taxPercentage}%)</span>
              <span className="font-medium">₹{taxes.toLocaleString()}</span>
            </div>

            {commission > 0 && (
              <div className="flex justify-between">
                <span className="text-sm">Commission ({commissionPercentage}%)</span>
                <span className="font-medium">₹{commission.toLocaleString()}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span className="text-sm">Discount</span>
                <span className="font-medium">
                  -₹{discount.toLocaleString()}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-premium">₹{total.toLocaleString()}</span>
            </div>

            <div className="mt-6">
              <Button
                className="w-full rounded-lg font-bold text-center"
                style={{ backgroundColor: "#038A5E" }}
                onClick={handleProceedToPay}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Booking"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription>
              Your reservation has been successfully confirmed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Confirmation ID:</strong> {bookingId}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Please save this confirmation ID for your records.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Check-in:</strong> {checkIn}
              </p>
              <p>
                <strong>Check-out:</strong> {checkOut}
              </p>
              <p>
                <strong>Room:</strong> {selectedRoom?.type}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹{total.toLocaleString()}
              </p>
            </div>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
              style={{ backgroundColor: "#038A5E" }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Booking Failed
            </DialogTitle>
            <DialogDescription>
              There was an error processing your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowErrorModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowErrorModal(false);
                  handleProceedToPay();
                }}
                className="flex-1"
                style={{ backgroundColor: "#038A5E" }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
