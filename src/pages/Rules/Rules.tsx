import React, { useState , useEffect } from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { useTheme } from '../../context/Theme/ThemeContext';
import { DataTable, PageHeader } from '../../components/molecules';
import { Images } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useBaseUrl } from '../../context/BaseUrl/BaseUrlContext';
import axios from 'axios';
import { useToast } from '../../context/Alert/AlertContext';
import Swal from 'sweetalert2';

type Device = {
  _id:string,
  title:string,
}

type User = {
  _id:string,
  fullName:string,
}

type Rule = {
  _id:string,
  userId:string,
  userName:string,
  deviceId:string,
  deviceName:string,
  imageUrl:string,
  emailStatus:string,
  dateCreated:string,
  //timeCreated:string,
  dateUpdated:string,
  //timeUpdated:string,
}

// Define columns for Devices page
const columns: GridColDef[] = [
  {
    field: 'image',
    headerName: 'Image',
    width: 150,
    renderCell: (params: any) => {
      return (
        <div className="flex items-center w-full h-full space-x-3">
          <img
            className="w-[40px] h-[40px] object-cover rounded-full"
            src={params.row.imageUrl
              ? params.row.imageUrl
              : Images.unknownRule}
            alt="Device Image"
          />
        </div>
      );
    },
  },
  {
    field: 'deviceId',
    headerName: 'Device Id',
    width: 200,
  },
  {
    field: 'deviceName',
    headerName: 'Title',
    width: 200,
  },
  {
    field: 'userId',
    headerName: 'User Id',
    width: 200,
  },
  {
    field: 'userName',
    headerName: 'User',
    width: 200,
  },
  {
    field: 'emailStatus',
    headerName: 'Send Email',
    width:100,
    align:"center"
  },
  {
    field: 'dateCreated',
    headerName: 'Created At',
    width: 150,
  },
  {
    field: 'dateUpdated',
    headerName: 'Updated At',
    width: 150,
  },
];

const Devices: React.FC = () => {
  const savedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
  const Token = savedUserData.accessToken;
  const UserType = savedUserData.userType;
  const UserId = savedUserData.userId;
  const { colors , theme } = useTheme();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isFormOpen , setIsFormOpen] = useState<boolean>(false);
  const { baseUrl } = useBaseUrl();
  const navigate = useNavigate();
  const [newRule, setNewRule] = useState({
    deviceName: '',
    image:null as File | null,
    userId:'',
    deviceId:'',
    userName: '',
    status: '',
    ruleType: '',
  });
  const { notify } = useToast();
const [users , setUsers] = useState<User[]>([]);
const [devices , setDevices] = useState<Device[]>([]);

  useEffect(() => {
    if(!Token){
      navigate("/");
    }else{
      FetchData();
    }
  },[Token]);

  const FetchData = async () => {
    try {
      const [usersResponse, devicesResponse, rulesResponse] = await Promise.all([
        axios.get(`${baseUrl}/users/all`, {
          headers: {
            token: `Bearer ${Token}`,
          },
        }),
        axios.get(`${baseUrl}/device/all`, {
          headers: {
            token: `Bearer ${Token}`,
          },
        }),
        // Conditional request based on UserType
        UserType === "Customer" 
          ? axios.get(`${baseUrl}/rules/all/user/${UserId}`, {
              headers: {
                token: `Bearer ${Token}`,
              },
            })
          : axios.get(`${baseUrl}/rules/all`, {
              headers: {
                token: `Bearer ${Token}`,
              },
            }),
      ]);
  
      // Check if all requests were successful
      if (usersResponse.data.status && devicesResponse.data.status && rulesResponse.data.status) {
        setUsers(usersResponse.data.users);
        setDevices(devicesResponse.data.devices);
        setRules(rulesResponse.data.rules);
      } else {
        notify("Failed to fetch data. Please try again later.", "error");
      }
    } catch (error) {
      console.error(error);
      notify("An unexpected error occurred. Please try again later.", "error");
    }
  };
  

  const HandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setNewRule((prevUser) => ({
        ...prevUser,
        image: files[0],
      }));
    }
  };
  
  const ImageUpload = async() => {
    if(!newRule.image){
      return null;
    }
    const data = {
      file:newRule.image
    }
    try {
      const response = await axios.post(`${baseUrl}/files/save`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: `Bearer ${Token}`,
        },
      });
      return response.data.fileName;
    } catch (error) {
      console.log(error);
    }
  }

  const CreateRule = async() => {
    const ImageUrl = await ImageUpload();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const data ={
      deviceId:newRule.deviceId,
      deviceName:newRule.deviceName,
      imageUrl:ImageUrl !== null ? `http://localhost:3300/uploads/${ImageUrl}` : null,
      userId:newRule.userId,
      userName:newRule.userName,
      emailStatus:newRule.status,
      dateCreated:date,
      timeCreated:time,
      dateUpdated:date,
      timeUpdated:time,
    }
    console.log("Rule Data ",data);
    try {
      const response = await axios.post(
        `${baseUrl}/rules/create`, data,
        {
          headers:{
            token: `Bearer ${Token}`,
          }
        }
      )

      if(response.data.status){
        Swal.fire({
          title: "",
          text: "New Rule Created Successfully!",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: theme === 'dark' ? "#86D293" : '#73EC8B',
          background: colors.primary[400],
          iconColor: "#06D001",
          confirmButtonText: "Ok",
          color: colors.grey[100],
          allowOutsideClick: false
        });
        FetchData();
        setIsFormOpen(false);
      }
    } catch (error:any) {
      console.log(error);
      notify(error.response.data.error.message, "error"); 
    }
  }

  const handleSubmit = () => {
    if(!newRule.userName){
      notify('Select User Name before click save button' , 'info');
      return;
    }
    if(!newRule.deviceName){
      notify('Select Device before click save button' , 'info');
      return
    }
    if(!newRule.status){
      notify('Select EmailStatus before click save button' , 'info');
      return
    }
    Swal.fire({
      title: "",
      text: "Are you sure you want to Create New Rule?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: theme === 'dark' ? "#86D293" : '#73EC8B',
      cancelButtonColor: theme === 'dark' ? "#B8001F" : "#C7253E",
      background: colors.primary[400],
      iconColor: colors.blueAccent[400],
      confirmButtonText: "Ok",
      color: colors.grey[100],
      allowOutsideClick: false
  }).then((result) => {
      if (result.isConfirmed) {
        CreateRule();
      }
  });
  };

  const statusChange = () => {

  }

  return (
    <div className='z-[100]'>
      <div className="flex items-center justify-between gap-10 lg:justify-start">
        <PageHeader title="RULES MANAGEMENT" subTitle="This is The Rules Management Page." />
        {UserType !== "Customer" && <button 
          onClick={() => setIsFormOpen(true)} 
          className={`bg-orange-400 px-4 py-3 text-[12px] rounded-md hover:bg-orange-300 duration-300 transition-colors`}
        >
          Add New Rule
        </button>}
      </div>
      {rules.length > 0 ? (
        <div className="min-h-[75vh] mt-5 overflow-y-auto">
          <DataTable 
            slug="rules" 
            columns={columns} 
            rows={rules}
            statusChange={statusChange}
            fetchData={FetchData} 
          />
        </div>
      ) : (
        <p style={{color:colors.grey[100]}} className='mt-10 text-lg font-semibold'>No Data Available...</p>
      )}

      {/* Popup Form for Adding New Rule */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black bg-opacity-50">
          <div className="w-full p-8 bg-white rounded-lg lg:w-2/3">
            <h2 className="mb-4 text-lg font-bold text-center text-black">Add New Rule</h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
              <label className='w-full font-semibold text-[13px]'>User Name</label>
              <select
                  name="userName"
                  value={newRule.userId}
                  onChange={(e) => setNewRule({...newRule , userId:e.target.value , userName:e.target.selectedOptions[0].text})}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                >
                  <option>None</option>
                  {users.length > 0 && users.map((user) =>(
                    <option key={user._id} value={user._id}>{user.fullName}</option>
                  ))}
                </select>
                </div>
                <div>
                <label className='w-full font-semibold text-[13px]'>Device Name</label>
              <select
                  name="deviceName"
                  value={newRule.deviceId}
                  onChange={(e) => setNewRule({...newRule , deviceId:e.target.value , deviceName:e.target.selectedOptions[0].text})}
                  className="w-full p-2 mt-2 border text-[12px] rounded-md"
                > <option>None</option>
                  {devices.length > 0 && devices.map((device) =>(
                    <option key={device._id} value={device._id}>{device.title}</option>
                  ))}
                </select>
                </div>
                <div>
                <label className='w-full font-semibold text-[13px]'>Choose Image</label>
              <input
                type="file"
                name="image"
                onChange={HandleFileChange}
                className="w-full p-2 mt-2 border text-[12px] rounded-md"
              />
              </div>
              <div>
              <label className='w-full font-semibold text-[13px]'>Email Status</label>
              <select
                name="status"
                value={newRule.status}
                onChange={(e) => setNewRule({...newRule , status:e.target.value})}
                className="w-full p-2 mt-2 border text-[12px] rounded-md"
              >
                <option>None</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                className="px-4 py-3 bg-gray-300 text-[12px] w-full rounded-md hover:bg-gray-400"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 text-white text-[12px] w-full bg-blue-500 rounded-md hover:bg-blue-600"
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
