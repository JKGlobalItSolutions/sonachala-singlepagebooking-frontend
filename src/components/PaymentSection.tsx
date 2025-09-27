import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onMakePayment: () => void;
  isProcessing: boolean;
  total: number;
}

export const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onMakePayment,
  isProcessing,
  total,
}: PaymentSectionProps) => {
  // const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Only UPI payment method is available
  const paymentMethods = [
    {
      id: "upi",
      name: "UPI",
      icon: Smartphone,
      description: "Pay using UPI apps",
    },
  ];

  // Example QR code image (replace with your actual QR code)
  const qrCodeUrl = "/public/placeholder.svg";

  return (
    <Card className="mb-6">
      <CardHeader className="bg-gradient-to-r from-luxury/10 to-luxury/5">
        <CardTitle className="text-xl font-bold text-premium">
          Make Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <Label className="text-base font-semibold mb-4 block">
            Select Payment Method
          </Label>
          {/* UPI Card clickable, no radio button */}
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                onPaymentMethodChange(method.id);
                setShowQr(false);
                setTimeout(() => setShowQr(true), 0);
              }}
            >
              <method.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <span className="font-medium">{method.name}</span>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2">
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I have read and agree to the{" "}
              <span className="text-primary underline cursor-pointer">
                Reservation Policy and Terms & Conditions
              </span>
            </Label>
          </div>
        </div>

        <div className="bg-gradient-to-r from-luxury/10 to-luxury/5 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-premium">
              ₹{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Removed Make Payment button. UPI popup will show every time UPI is clicked. */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
           Your payment information is safe
          and encrypted
        </p>
        {/* UPI QR Code Popup */}
        <Dialog open={showQr} onOpenChange={setShowQr}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Scan to Pay (UPI)</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                className="w-48 h-48 object-contain border rounded-lg"
              />
              <p className="text-center text-muted-foreground text-sm">
                Open your UPI app and scan this QR code to pay.
              </p>
              <p className="text-center text-premium text-sm font-semibold">
                After payment, please upload your payment proof image in the
                Guest Information section below.
              </p>

              <Button variant="outline" onClick={() => setShowQr(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
