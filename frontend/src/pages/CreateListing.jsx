import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  CheckIcon, ChevronRightIcon, ChevronLeftIcon, UploadIcon, CameraIcon, HomeIcon, KeyIcon, SparkleIcon, XIcon,
} from '../components/icons';
import { PROPERTY_TYPES, LISTING_TYPES, CURRENCIES, COMMON_AMENITIES } from '../utils/constants';
import { prepareUploadFile } from '../utils/images';

const STEPS = [
  { id: 0, label: 'Basics', icon: <HomeIcon size={17} /> },
  { id: 1, label: 'Pricing', icon: <KeyIcon size={17} /> },
  { id: 2, label: 'Amenities', icon: <SparkleIcon size={17} /> },
  { id: 3, label: 'Photos', icon: <CameraIcon size={17} /> },
  { id: 4, label: 'Review', icon: <CheckIcon size={17} /> },
];

const INITIAL = {
  title: '',
  description: '',
  propertyType: '',
  listingType: '',
  price: '',
  currency: 'USD',
  bedrooms: '',
  bathrooms: '',
  area: '',
  amenities: [],
  photos: [],
};

function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.title.trim() && form.description.trim() && form.propertyType && form.listingType;
      case 1: return form.price !== '' && form.bedrooms !== '' && form.bathrooms !== '' && form.area !== '';
      case 2: return true;
      case 3: return form.photos.length > 0;
      default: return true;
    }
  };

  const uploadPhotos = async (files) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.warning('Only image files are accepted');
    }
    if (imageFiles.length === 0) return;

    setUploading(true);
    const next = [...form.photos];
    try {
      // Upload sequentially to keep memory predictable and show real progress.
      // Photos are downscaled/compressed first so requests stay under the
      // serverless upload ceiling (~4 MB) — see prepareUploadFile.
      for (const file of imageFiles) {
        const prepared = await prepareUploadFile(file);
        const fd = new FormData();
        fd.append('images', prepared);
        const response = await apiClient.postForm('/upload', fd);
        const urls = response?.data?.urls || [];
        next.push(...urls);
        setForm(prev => ({ ...prev, photos: [...next] }));
      }
      toast.success(`${imageFiles.length} ${imageFiles.length === 1 ? 'photo' : 'photos'} uploaded`);
    } catch (err) {
      toast.error(err.message || 'Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: parseFloat(form.price),
        currency: form.currency,
        bedrooms: parseInt(form.bedrooms, 10),
        bathrooms: parseFloat(form.bathrooms),
        area: parseFloat(form.area),
        amenities: form.amenities,
        listingPhotoPaths: form.photos,
        status: 'published',
        owner: user._id,
      };
      const response = await apiClient.post('/properties', payload);
      toast.success('Property listed successfully');
      navigate(`/properties/${response._id}`);
    } catch (err) {
      toast.error(err.message || 'Could not create the listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create page-fade">
      <Navbar />

      <header className="create-head">
        <div className="container">
          <h1 className="create-title">List your property</h1>
          <p className="create-sub">Reach thousands of home-seekers. Fill in the details and go live.</p>
        </div>
      </header>

      <div className="container">
        <div className="stepper" role="tablist" aria-label="Listing steps">
          {STEPS.map(s => {
            const state = step > s.id ? 'done' : step === s.id ? 'active' : '';
            return (
              <div key={s.id} className={`step step--${state}`}>
                <span className="step-num">
                  {step > s.id ? <CheckIcon size={15} /> : s.icon}
                </span>
                <span className="step-label">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="create-card">
          {step === 0 && (
            <div>
              <div className="create-card-head">
                <HomeIcon size={22} />
                <div>
                  <h2>Basic information</h2>
                  <p>Tell buyers and renters what makes this place special.</p>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cl-title">Listing title</label>
                <input
                  id="cl-title"
                  className="field-input"
                  placeholder="E.g. Sunlit two-bedroom villa with private pool"
                  value={form.title}
                  onChange={set('title')}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cl-desc">Description</label>
                <textarea
                  id="cl-desc"
                  className="field-input"
                  placeholder="Describe the home, neighbourhood, and what makes it special…"
                  value={form.description}
                  onChange={set('description')}
                />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label" htmlFor="cl-type">Property type</label>
                  <select id="cl-type" className="field-input" value={form.propertyType} onChange={set('propertyType')}>
                    <option value="">Select type</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cl-listing">Listing type</label>
                  <select id="cl-listing" className="field-input" value={form.listingType} onChange={set('listingType')}>
                    <option value="">Select</option>
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t === 'Rent' ? 'For rent' : 'For sale'}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="create-card-head">
                <KeyIcon size={22} />
                <div>
                  <h2>Pricing & size</h2>
                  <p>Set expectations clearly with honest numbers.</p>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label" htmlFor="cl-price">Price</label>
                  <input
                    id="cl-price"
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder={form.listingType === 'Rent' ? 'Monthly rent' : 'Asking price'}
                    value={form.price}
                    onChange={set('price')}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cl-currency">Currency</label>
                  <select id="cl-currency" className="field-input" value={form.currency} onChange={set('currency')}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="field-label" htmlFor="cl-bed">Bedrooms</label>
                  <select id="cl-bed" className="field-input" value={form.bedrooms} onChange={set('bedrooms')}>
                    <option value="">Select</option>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="cl-bath">Bathrooms</label>
                  <select id="cl-bath" className="field-input" value={form.bathrooms} onChange={set('bathrooms')}>
                    <option value="">Select</option>
                    {[1, 1.5, 2, 2.5, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cl-area">Area (sq ft)</label>
                <input
                  id="cl-area"
                  className="field-input"
                  type="number"
                  min="0"
                  placeholder="1,250"
                  value={form.area}
                  onChange={set('area')}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="create-card-head">
                <SparkleIcon size={22} />
                <div>
                  <h2>Amenities</h2>
                  <p>Select what this property includes — optional.</p>
                </div>
              </div>
              <div className="amenity-grid">
                {COMMON_AMENITIES.map(amenity => {
                  const on = form.amenities.includes(amenity);
                  return (
                    <label key={amenity} className={`amenity-check ${on ? 'amenity-check--on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleAmenity(amenity)} />
                      {amenity}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="create-card-head">
                <CameraIcon size={22} />
                <div>
                  <h2>Photos</h2>
                  <p>High-quality photos make all the difference. Upload up to 10.</p>
                </div>
              </div>
              <label className="photo-drop" htmlFor="cl-photos">
                <UploadIcon size={30} />
                <p>{uploading ? 'Uploading…' : 'Click to upload photos'}</p>
                <span>JPG or PNG · up to 8MB each</span>
              </label>
              <input
                id="cl-photos"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  uploadPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
              {form.photos.length > 0 && (
                <div className="photo-previews">
                  {form.photos.map((url, i) => (
                    <div key={i} className="photo-preview">
                      <img src={url} alt={`Upload ${i + 1}`} loading="lazy" />
                      <button
                        className="photo-preview-remove"
                        onClick={() => removePhoto(i)}
                        aria-label={`Remove photo ${i + 1}`}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="create-card-head">
                <CheckIcon size={22} />
                <div>
                  <h2>Review & publish</h2>
                  <p>Confirm everything looks right before going live.</p>
                </div>
              </div>
              <div className="review-grid">
                <div className="review-row">
                  <div className="review-row-label">Title</div>
                  <div className="review-row-value">{form.title || '—'}</div>
                </div>
                <div className="review-row">
                  <div className="review-row-label">Listing</div>
                  <div className="review-row-value">{form.listingType ? (form.listingType === 'Rent' ? 'For rent' : 'For sale') : '—'} · {form.propertyType || '—'}</div>
                </div>
                <div className="review-row">
                  <div className="review-row-label">Price</div>
                  <div className="review-row-value">
                    {form.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency, maximumFractionDigits: 0 }).format(form.price) : '—'}
                  </div>
                </div>
                <div className="review-row">
                  <div className="review-row-label">Size</div>
                  <div className="review-row-value">{form.bedrooms} beds · {form.bathrooms} baths · {form.area} sq ft</div>
                </div>
                <div className="review-row">
                  <div className="review-row-label">Amenities</div>
                  <div className="review-row-value">{form.amenities.length > 0 ? form.amenities.join(', ') : 'None selected'}</div>
                </div>
                <div className="review-row">
                  <div className="review-row-label">Photos</div>
                  <div className="review-row-value">{form.photos.length} uploaded</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="create-nav">
          <button
            className="btn btn--outline"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            <ChevronLeftIcon size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn--gold"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed() || uploading}
            >
              Continue <ChevronRightIcon size={16} />
            </button>
          ) : (
            <button className="btn btn--gold" onClick={handleSubmit} disabled={submitting || uploading}>
              {submitting ? 'Publishing…' : 'Publish listing'}
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CreateListing;