const Assignment = require('../models/assignment');
const Classroom = require('../models/classroom');
const { cloudinary } = require("../cloudinary");
const Submission = require('../models/submission');
const { Copyleaks,
    CopyleaksConfig,
    CopyleaksURLSubmissionModel,
    CopyleaksFileSubmissionModel,
    CopyleaksFileOcrSubmissionModel,
    CopyleaksDeleteRequestModel,
    CopyleaksExportModel
  } = require('plagiarism-checker');  
const copyleaks = new Copyleaks();


function TEST_submitUrlAsync(loginResult, WEBHOOK_URL, url) {
    var submission = new CopyleaksURLSubmissionModel(url.toString(),
      {
  
        sandbox: true,
        webhooks: {
          status: `${WEBHOOK_URL}/copyleaks/{STATUS}`
        }
      }
    );
  
    copyleaks.submitUrlAsync('education', loginResult, Date.now() + 1, submission).then(res => logSuccess('submitUrlAsync - education', res), err => { logError('submitUrlAsync - education', err) });
  }

function logError(title, err) {
    console.error('----------ERROR----------');
    console.error(`${title}:`);
    console.error(err);
    console.error('-------------------------');
  }
  
  function logSuccess(title, result) {
    console.log('----------SUCCESS----------');
    console.log(`${title}`);
    if (result) {
      console.log(`result:`);
      console.log(result);
    }
    console.log('-------------------------');
  }

module.exports.index = async (req, res) => {
    const classroom = await Classroom.findById(req.params.id).populate({
        path: 'assignments',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!classroom) {
        req.flash('error', 'Cannot find that classroom!');
        return res.redirect('/classrooms');
    }
    res.render('assignments/index', { classroom });
}

module.exports.showAssignment = async (req, res) => {
    const classroom = await Classroom.findById(req.params.id).populate({
        path: 'announcements',
        populate: {
            path: 'author'
        }
    })
    .populate('author');
    const assignment = await Assignment.findById(req.params.__id).populate({
        path: 'submissions',
        populate: {
            path: 'author'
        }
    })
    .populate('author');
    if (!classroom) {
        req.flash('error', 'Cannot find that classroom!');
        return res.redirect('/classrooms');
    }
    if (!assignment) {
        req.flash('error', 'Cannot find that assignment!');
        return res.redirect(`/classrooms/${classroom._id}/assignments`);
    }
    res.render('assignments/show', { assignment, classroom });
}

module.exports.createSubmission = async (req, res) => {
    const classroom = await Classroom.findById(req.params.id);
    const assignment = await Assignment.findById(req.params.__id);
    const submission = new Submission();
    submission.files = req.files.map(f => ({ url: f.path, filename: f.filename }));
    submission.author = req.user._id;
    assignment.submissions.push(submission);
    await submission.save();
    await assignment.save();
    req.flash('success', 'Created new submission!');
    res.redirect(`/classrooms/${classroom._id}/assignments/${assignment._id}`);
}

module.exports.createAssignment = async (req, res) => {
    const classroom = await Classroom.findById(req.params.id);
    const assignment = new Assignment(req.body.assignment);
    assignment.files = req.files.map(f => ({ url: f.path, filename: f.filename }));
    assignment.author = req.user._id;
    classroom.assignments.push(assignment);
    await assignment.save();
    await classroom.save();
    req.flash('success', 'Created new assignment!');
    res.redirect(`/classrooms/${classroom._id}/assignments`);
}

module.exports.checkPlagiarism = async (req, res) => {
    const submission = await Submission.findById(req.params.id)
    .populate('author');
    if (!submission) {
        req.flash('error', 'Cannot find that submission!');
        return res.redirect('/classrooms');
    }
    let loginResult = {

    };

    let WEBHOOK_URL = 'https://en4tzd3hrhke7bw.m.pipedream.net';
    //let WEBHOOK_URL = 'https://webhook.site/a02056a2-d6de-4c30-8572-e8ad4ec6b736';

      let url = submission.files[0].url;
    TEST_submitUrlAsync(loginResult, WEBHOOK_URL, url);
}

module.exports.showReport = async (req, res) => {
    let data = req.body;
    //console.log(data);
    res.render('report');
}