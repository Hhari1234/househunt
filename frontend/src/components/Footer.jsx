import { Link } from 'react-router-dom';
import { HomeIcon } from './icons';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <span className="nav-logo-mark"><HomeIcon size={18} /></span>
            HouseHunt
          </span>
          <p className="footer-tagline">
            A premium real-estate marketplace. Discover exceptional homes for rent and sale — find a place you'll love to call home.
          </p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/properties">All properties</Link>
          <Link to="/properties?listingType=Rent">For rent</Link>
          <Link to="/properties?listingType=Sale">For sale</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/favorites">Saved homes</Link>
          <Link to="/bookings">Bookings</Link>
          <Link to="/account">Account</Link>
          <Link to="/create-listing">List a property</Link>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <span>About</span>
          <span>Contact</span>
          <span>Privacy policy</span>
          <span>Terms of service</span>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© {new Date().getFullYear()} HouseHunt. All rights reserved.</span>
          <span className="footer-credit">
            Built by <strong>Hariraj K</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;