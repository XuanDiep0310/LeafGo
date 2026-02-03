namespace LeafGo.Application.DTOs.Ride
{
    public class CreateRideResponse
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PickupAddress { get; set; } = string.Empty;
        public string DestinationAddress { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal EstimatedPrice { get; set; }
        public DateTime RequestedAt { get; set; }
        public VehicleTypeInfoDto VehicleType { get; set; } = null!;
    }
}
