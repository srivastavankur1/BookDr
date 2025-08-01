import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointModel from "../models/appointmentModel.js"

const changeAvailability = async (req, res)=>{
    try {
        
        const {docId} = req.docId
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, {available: !docData.available})
        res.json({success:true, message:'Availability Changed'})

    } catch (error) {
        console.log(error)
        return res.json({success:false, message:error.message})
    }
}

const doctorsList = async(req, res)=>{
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({success:true, doctors})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

//api for doctor login
const loginDoctor = async (req, res)=>{
    try {
        const {email, password} = req.body
        if (!email.endsWith("@bookdr.com")) {
            return res.json({
              success: false,
              message: "Please Verify Your Identity",
            });
          }
        const doctor = await doctorModel.findOne({email})

        if(!doctor){
            return res.json({success:true, message:'Invalid credentials'})
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if(isMatch){
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET)
            res.json({success:true, token})
        }else{
            return res.json({success:false, message:'Invalid credentials'})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// api to get doctor appointments for doctor panel

const appointmentsDoctor = async (req, res) => {
    try {
        console.log("docId from token (in controller):", req.docId); 

        const appointments = await appointModel.find({ docId: req.docId });
        // console.log("appointments from DB:", appointments);

        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//api to mark appointment completed for admin panel

const appointmentComplete = async (req, res)=>{
    try {
        const docId = req.docId;
        const appointmentId = req.body.appointmentId || req.params.appointmentId || req.query.appointmentId;

        const appointmentData = await appointModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId === docId){
            await appointModel.findByIdAndUpdate(appointmentId, {isCompleted:true})
            return res.json({success:true, message:'Appointment Complete'})
        }else{
            return res.json({success:false, message:'Mark Failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//api to cancel appointment completed for admin panel

const appointmentCancel = async (req, res)=>{
    try {
        const docId = req.docId;
        const appointmentId = req.body.appointmentId || req.params.appointmentId || req.query.appointmentId;

        const appointmentData = await appointModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId === docId){
            await appointModel.findByIdAndUpdate(appointmentId, {cancelled:true})
            return res.json({success:true, message:'Appointment Cancelled'})
        }else{
            return res.json({success:false, message:'Cancellation Failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// api to get dashboard data for doctor panel
const doctorDashboard = async(req, res)=>{
    try {
        const docId = req.docId
        const appointments = await appointModel.find({docId})

        let earnings =0

        appointments.map((item)=>{
            if(item.isCompleted || item.payment){
                earnings += item.amount
            }
        })

        let patients=[]
        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData ={
            earnings,
            appointments:appointments.length,
            patients:patients.length,
            latestAppointments:appointments.reverse().slice(0,5)
        }
        return res.json({success:true, dashData})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// api to get doctor profile for doctor panel
const doctorProfile = async(req, res)=>{
    try {
        const docId = req.docId
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({success:true, profileData})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//api to update doctor profile data from doctor panel
const updateDoctorProfile = async(req, res)=>{
    try {
        const docId = req.docId
        const {fees, address, available}= req.body
        await doctorModel.findByIdAndUpdate(docId, {fees, address, available})
        res.json({success:true, message:'Profile Updated'})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {changeAvailability, doctorsList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, updateDoctorProfile, doctorProfile}