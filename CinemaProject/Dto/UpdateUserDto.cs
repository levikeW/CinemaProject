namespace CinemaProject.Dto
{
    public class UpdateUserDto
    {
        public int UserId { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? Password { get; set; }
        public string? BillingAddress { get; set; }
    }
}
