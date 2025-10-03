import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Wifi, Car, Coffee, ShowerHead, AlertTriangle } from "lucide-react";
import { Hotel } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface RoomCardProps {
  id: string;
  name: string;
  image: string;
  description: string;
  roomDescription: string;
  price: number;
  originalPrice?: number;
  features: string[];
  capacity: number;
  bedType: string;
  isPopular?: boolean;
  availableCount?: number;
  isUnavailable?: boolean;
  isSoldOut?: boolean;
  onBookNow?: (roomId: string) => void;
}

export const RoomCard = ({
  id,
  name,
  image,
  description,
  roomDescription,
  price,
  originalPrice,
  features,
  capacity,
  bedType,
  isPopular,
  availableCount,
  isUnavailable,
  isSoldOut,
  onBookNow,
}: RoomCardProps) => {
  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="w-4 h-4" />;
      case 'parking':
        return <Car className="w-4 h-4" />;
      case 'breakfast':
        return <Coffee className="w-4 h-4" />;
      case 'ensuite bathroom':
        return <ShowerHead className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isBookable = !isUnavailable && !isSoldOut && onBookNow;

  return (
    <Card className={`overflow-hidden transition-shadow duration-300 ${isBookable ? 'hover:shadow-lg' : 'opacity-60'}`}>
      <div className="md:flex">
        <div className="md:w-1/3 relative">
          <img
            src={image}
            alt={name}
            className="w-50 h-50 md:h-full object-cover"
          />
          {isUnavailable && !isSoldOut && (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-orange-500 text-white"
            >
              Limited Availability
            </Badge>
          )}
          {availableCount !== undefined && availableCount > 0 && !isUnavailable && !isSoldOut && (
            <Badge
              variant="destructive"
              className="absolute top-3 left-3 bg-green-600 text-white"
            >
              Only {availableCount} left
            </Badge>
          )}
        </div>

        <CardContent className="md:w-2/3 p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
      

<h3 className="flex items-center gap-2 text-xl font-bold text-premium mb-1">
  <Hotel className="w-5 h-5 text-premium" />
  {name}
</h3>

              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-2">{roomDescription}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-sm text-blue-600 hover:text-blue-800 ">
                      See More...
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-premium flex items-center gap-2">
                        <Hotel className="w-6 h-6" />
                        {name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Images Section */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <img
                            src={image}
                            alt={`${name} - another view`}
                            className="w-full h-30 object-cover rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Description Section */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-muted-foreground leading-relaxed">
                            {roomDescription}
                          </p>
                        </div>

                        {/* Facilities Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">Facilities</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                              "24/7 room service",
                              "Complimentary Packaged Water Bottles",
                              "Direct-Dialing Phone",
                              "Double Bed",
                              "Hair Dryer",
                              "High Speed Wi-Fi Internet(chargable)",
                              "Kettle",
                              "King Bed",
                              "Marble Flooring",
                              "Shower",
                              "Sound proof windows",
                              "Study Table",
                              "Work Desk",
                              "Complimentary toiletries",
                              "Internet"
                            ].map((facility, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-700">{facility}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-premium">
                ₹{(price ?? 0).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">per night</span>
              </div>
              {originalPrice !== undefined && originalPrice !== null && (
                <div className="text-sm text-muted-foreground line-through">
                  ₹{(originalPrice ?? 0).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{capacity} Guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{bedType}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {(features ?? []).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {getFeatureIcon(feature)}
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <div>✓ Free cancellation up to 1 day before</div>
              <div>✓ Pay at hotel</div>
            </div>
            <Button
              variant="luxury"
              onClick={() => isBookable && onBookNow(id)}
              className="ml-4"
              disabled={!isBookable}
            >
              {isSoldOut ? 'Sold Out' : isUnavailable ? 'Check Availability' : 'Book Now'}
            </Button>
          </div>
        </CardContent>
      </div>
      {isSoldOut && (
        <div className="bg-red-50 text-red-800 p-3 flex items-center justify-center border-t">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">{name} is sold out on selected dates</span>
        </div>
      )}
    </Card>
  );
};
