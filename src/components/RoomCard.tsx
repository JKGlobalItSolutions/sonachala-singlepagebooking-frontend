import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Wifi, Car, Coffee, ShowerHead } from "lucide-react";

interface RoomCardProps {
  id: string;
  name: string;
  image: string;
  description: string;
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
            className="w-full h-48 md:h-full object-cover"
          />
          {isSoldOut && (
            <Badge
              variant="destructive"
              className="absolute top-3 left-3 bg-red-600 text-white"
            >
              Sold Out
            </Badge>
          )}
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
              <h3 className="text-xl font-bold text-premium mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{description}</p>
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
    </Card>
  );
};
