const bodyParser = require('body-parser');
const express =require('express');
const mongoose =require('mongoose');

const app= express();
const PORT=3001;

//connecting to mongodb database
mongoose.connect('mongodb+srv://Lalitha:7X6oL5r8FMCGJPSR@cluster0.iyiyrqz.mongodb.net/',{useNewUrlParser: true, useUnifiedTopology:true})
    .then(()=> console.log('connected to mongodb'))
    .catch(err=> console.error('Error connecting to mongodb',err));

    app.use(bodyParser.json());

    //defining model
const mentorSchema = new mongoose.Schema({
    name:String,
    students:[{ type: mongoose.Schema.Types.ObjectId, ref:'Student'}],
});

const studentSchema =new mongoose.Schema({
    name:String,
    mentor:{type: mongoose.Schema.Types.ObjectId, ref:'Mentor'},
});

const Mentor= mongoose.model('Mentor', mentorSchema);
const Student= mongoose.model('Student', studentSchema);

//api to create mentor
app.post('/mentors', async(req,res)=>{
    const {name} =req.body;
    try{
        const mentor=await Mentor.create({name});
        res.status(201).json(mentor);
    } catch(err){
        res.status(500).json({message:'Error creating mentor'});
    }
})

//api to create student 
app.post('/students', async (req, res) => {
    const { name } = req.body;
    try {
      const student = await Student.create({ name });
      res.status(201).json(student);
    } catch (err) {
      res.status(500).json({ message: 'Error creating student' });
    }
  });

//api endpoint to assign a student to mentor
app.post('/mentors/:mentorId/students', async(req, res)=>{
    const{mentorId} = req.params;
    const {studentId} =req.body;
    try{
        const mentor=await Mentor.findById(mentorId);
        if(!mentor){
            return res.status(404).json({message:'Mentor not found'});
        }
        const student=await Student.findById(studentId);
        if(!student){
            return res.status(404).json({message:'student not found'});
        }
        //checking if the student already has a mentor
        if(student.mentor){
            return res.status(400).json({message:'student already has a mentor'});
        }
        mentor.students.push(student._id);
        await mentor.save();

        student.mentor = mentor._id;
        await student.save();
        res.status(200).json({ message: 'Student assigned to mentor successfully' });
    } catch (err){
        res.status(500).json({ message: 'Error assigning student to mentor' });
    }
    });
// api endpoint to change or assign mentor for a particular student 

app.put('/students/:studentId/mentor', async (req, res) => {
    const { studentId } = req.params;
    const { mentorId } = req.body;
    try {
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }
  
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      if (student.mentor && student.mentor.toString() === mentorId) {
        return res.status(400).json({ message: 'Student already assigned to this mentor' });
      }
  
      if (student.mentor) {
        // Remove the student from the previous mentor's list
        const previousMentor = await Mentor.findById(student.mentor);
        previousMentor.students.pull(student._id);
        await previousMentor.save();
      }
  
      mentor.students.push(student._id);
      await mentor.save();
  
      student.mentor = mentor._id;
      await student.save();
  
      res.status(200).json({ message: 'Student\'s mentor changed successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error changing student\'s mentor' });
    }
  });

  //api endpoint to show all students for a particular mentor
  app.get('/mentors/:mentorId/students', async (req, res) => {
    const { mentorId } = req.params;
    try {
      const mentor = await Mentor.findById(mentorId).populate('students');
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }
  
      res.status(200).json(mentor.students);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching students for mentor' });
    }
  });

  //api endpoint to show the previously assigned mentor for a particular student
  app.get('/students/:studentId/previousMentor', async (req, res) => {
    const { studentId } = req.params;
    try {
      const student = await Student.findById(studentId).populate('mentor');
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      if (!student.mentor) {
        return res.status(200).json({ message: 'Student does not have a previous mentor' });
      }
  
      res.status(200).json(student.mentor);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching previous mentor for student' });
    }
  });

    //to start the server
    app.listen(PORT,()=>{
        console.log(`server running on http://localhost:${PORT}`);
    });
