import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';

const CsvUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [subscriptionPrices, setSubscriptionPrices] = useState<any[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [basePrice, setBasePrice] = useState('');
  const [pricePerCreditLine, setPricePerCreditLine] = useState('');
  const [pricePerCreditScorePoint, setPricePerCreditScorePoint] = useState('');

  const itemsPerPage = 100;

  useEffect(() => {
    fetchData(currentPage + 1);
  }, [currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('basePrice', basePrice);
    formData.append('pricePerCreditLine', pricePerCreditLine);
    formData.append('pricePerCreditScorePoint', pricePerCreditScorePoint);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setUploadProgress(Math.round((loaded * 100) / total));
        },
      });

      setMessage(response.data.message);
      setUploadedData(response.data.data);
      setSubscriptionPrices(response.data.subscriptionPrices);
      setPageCount(response.data.totalPages);
      setCurrentPage(0);
    } catch (error) {
      console.error(error);
      setMessage('Failed to upload file');
    }
  };

  const handlePageClick = async (data: { selected: number }) => {
    setCurrentPage(data.selected);
  };

  const fetchData = async (page: number) => {
    try {
      const response = await axios.get('http://localhost:5000/data', {
        params: { page, limit: itemsPerPage },
      });

      setUploadedData(response.data.data);
      setSubscriptionPrices(response.data.subscriptionPrices);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white">
      <h2 className="bg-blue-400 font-bold text-white text-3xl flex justify-center items-center max-h-max p-4">Subscription Pricing Formula</h2>
      <div className='bg-amber-400 w-[400px] h-[400px] flex justify-center items-center text-center ml-[35rem] shadow-2xl p-6  mt-7 rounded-3xl'>
      <div className="flex flex-col justify-center items-center mt-4 max-h-max p-4  ">
        <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4 ml-16" />
        <input
          type="text"
          placeholder="Base Price"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          className="mb-3 p-2 border border-gray-300 rounded-xl shadow-2xl bg-blue-300 text-white font-bold placeholder-white"
        />
        <input
          type="text"
          placeholder="Price Per Credit Line"
          value={pricePerCreditLine}
          onChange={(e) => setPricePerCreditLine(e.target.value)}
          className="mb-3 p-2 border border-gray-300 rounded-xl shadow-2xl bg-blue-300 text-white font-bold placeholder-white"
        />
        <input
          type="text"
          placeholder="Price Per Credit Score Point"
          value={pricePerCreditScorePoint}
          onChange={(e) => setPricePerCreditScorePoint(e.target.value)}
          className="mb-3 p-2 border border-gray-300 rounded-xl shadow-2xl bg-blue-300 text-white font-bold placeholder-white"
        />
        <button onClick={handleUpload} className="bg-green-400 rounded-lg p-4 h-14 w-20 font-bold text-white  flex justify-center items-center">Upload</button>
      </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        {uploadProgress > 0 && <p className="text-xl font-semibold mt-4">Upload Progress: {uploadProgress}%</p>}
        <div className="text-xl font-semibold">
          {message && <p>{message}</p>}
        </div>
      </div>
      {uploadedData.length > 0 && (
        <div className="flex flex-col justify-center items-center mt-28 font-bold">
          <table className="min-w-full divide-y divide-gray-200 ">
            <thead>
              <tr>
                {Object.keys(uploadedData[0]).map((key) => (
                  <th key={key} className="px-6 py-3 text-center bg-amber-400 text-lg leading-4 font-medium text-white uppercase tracking-wider">{key}</th>
                ))}
                <th className="px-6 py-3 bg-amber-400 text-left text-lg leading-4 font-medium text-white uppercase tracking-wider">Subscription Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploadedData.map((row, index) => (
                <tr key={index} className="py-4 text-white bg-blue-300 text-center whitespace-no-wrap">
                  {Object.values(row).map((value, i) => (
                    <td key={i}>{value}</td>
                  ))}
                  <td className="py-4 text-white bg-blue-300 whitespace-no-wrap">{subscriptionPrices[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={'pagination'}
            subContainerClassName={'pages pagination'}
            activeClassName={'active'}
            pageClassName={'page-item'}
            pageLinkClassName={'page-link'}
            previousClassName={'page-item'}
            previousLinkClassName={'page-link'}
            nextClassName={'page-item'}
            nextLinkClassName={'page-link'}
          />
        </div>
      )}
    </div>
  );
};

export default CsvUploader;
