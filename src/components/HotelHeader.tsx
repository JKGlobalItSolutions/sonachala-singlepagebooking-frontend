import { MapPin, Phone, Star } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";

const HotelHeader: React.FC = () => {


  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



const hotelId = import.meta.env.VITE_HOTEL_ID;
const apiBase = import.meta.env.VITE_API_BASE 




  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await axios.get(`${apiBase}/hotel/${hotelId}`);
        setHotel(res.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch hotel");
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [hotelId]);

  return (
    <div className="bg-gradient-to-r from-premium to-premium/90 text-premium-foreground py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            {loading ? (
              <h1>Loading hotel details...</h1>
            ) : error ? (
              <h1>{error}</h1>
            ) : hotel ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{hotel.name}</h1>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(hotel.stars || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-luxury text-luxury" />
                  ))}
                </div>
                <div className="flex flex-col md:flex-row gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{hotel.address || "No address provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{hotel.contact || "No phone provided"}</span>
                    
                  </div>
                </div>
                {hotel.description && <p className="mt-2">{hotel.description}</p>}
              </>
            ) : (
              <h1>No hotel data found.</h1>
            )}
          </div>
        </div>
      </div>
    </div>
  );
 
};

export default HotelHeader;
