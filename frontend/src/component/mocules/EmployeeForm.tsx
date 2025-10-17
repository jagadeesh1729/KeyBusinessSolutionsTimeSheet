import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { PatternFormat } from 'react-number-format';

const EmployeeForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    no_of_hours: 0,
    start_date: '',
    end_date: '',
    visa_status: '',
    college_name: '',
    college_address: '',
    degree: '',
    college_Dso_name: '',
    college_Dso_email: '',
    college_Dso_phone: '',
    date_of_birth: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.phone) {
      setError('First Name, Last Name, Email, Phone, and Password are required.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      // Ensure date fields are ISO yyyy-mm-dd
      const payload = {
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        date_of_birth: formData.date_of_birth || undefined,
      };
      await apiClient.post('/auth/register-employee', payload);
      setSuccess('Registration successful! You will be redirected to the login page.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              Employee Registration
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Join our team and start your journey with us
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-8 py-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                <p className="text-green-700">{success}</p>
              </div>
            )}
            
            <div className="space-y-10">
              {/* Personal Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500 mb-4">Tell us about yourself</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your email address"
                  />
                </div>
                </div>
              </div>
              
              {/* Contact & Security */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contact & Security</h2>
                <p className="text-sm text-gray-500 mb-4">How can we reach you?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <PatternFormat
                    format={"+1(###)-(###)-(####)"}
                    allowEmptyFormatting
                    value={formData.phone}
                    onValueChange={(vals) => setFormData(prev => ({ ...prev, phone: vals.formattedValue }))}
                    name="phone"
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-10 text-sm text-blue-600 hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
                    <input
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="Enter your current location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                  </div>
                </div>
              </div>
              
              {/* Employment Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Employment Details</h2>
                <p className="text-sm text-gray-500 mb-4">Relevant dates and status</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OPT/Stem-OPT Start Date</label>
                  <input
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OPT/Stem-OPT End Date</label>
                  <input
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status</label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="visa_status"
                        value="cpt"
                        checked={formData.visa_status === 'cpt'}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>CPT</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="visa_status"
                        value="opt"
                        checked={formData.visa_status === 'opt'}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>OPT</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="visa_status"
                        value="stemopt"
                        checked={formData.visa_status === 'stemopt'}
                        onChange={handleChange}
                       className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>STEM OPT</span>
                    </label>
                  </div>
                  </div>
                </div>
              </div>
              
              {/* Education */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                <p className="text-sm text-gray-500 mb-4">Your academic background</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
                  <input
                    name="college_name"
                    type="text"
                    value={formData.college_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your college name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                  <input
                    name="degree"
                    type="text"
                    value={formData.degree}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your degree"
                  />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College Address</label>
                <input
                  name="college_address"
                  type="text"
                  value={formData.college_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter your college address"
                />
                </div>
              </div>

              {/* College DSO */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">College DSO</h2>
                <p className="text-sm text-gray-500 mb-4">Designated School Official contact</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College DSO Name</label>
                  <input
                    name="college_Dso_name"
                    type="text"
                    value={formData.college_Dso_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter DSO name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College DSO Email</label>
                  <input
                    name="college_Dso_email"
                    type="email"
                    value={formData.college_Dso_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter DSO email"
                  />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College DSO Phone</label>
                <input
                  name="college_Dso_phone"
                  type="text"
                  value={formData.college_Dso_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Enter DSO phone"
                />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-8 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition duration-200"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition duration-200 transform hover:scale-105"
              >
                Register Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
