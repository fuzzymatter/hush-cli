import { prompt } from 'prompts';
import * as ware from 'ware';
import chalk from 'chalk';
import { isName, isEmail } from '../lib/validation';
import { signup, isVerificationCodeValid } from '../lib/hush';

const signupRoutine = ware();

const questions = {
  name: {
    type: 'text',
    name: 'name',
    message: 'Enter your name',
    validate: name => isName(name) ? true : "The name you've entered is invalid",
  },
  email: {
    type: 'text',
    name: 'email',
    message: 'Enter your email',
    validate: email => isEmail(email) ? true : "The email you've entered is invalid",
  },
  reEnterEmail: {
    type: 'confirm',
    name: 'reEnterEmail',
    message: 'Would you like to try a different email?',
    initial: true,
  },
  verificationCode: {
    type: 'text',
    name: 'code',
    message: 'Enter verification code:',
  },
};

const validateParams = (req, res, next) => {
  // We need interaction for signup
  if (!req.params.interaction)
    next(new Error('The signup command requires interactivity to be enabled.'));
  
  const validParams:any = {};
  
  if (isEmail(req.params.email)) validParams.email = req.params.email;
  if (isName(req.params.name)) validParams.name = req.params.name;
  
  req.validParams = validParams;
  next();
};

const promptMissingParams = async (req, res, next) => {
  let warnings = [];
  let missingQuestions:{}[] = [];

  if(!req.validParams.hasOwnProperty('email')) {
    warnings.push("required argument 'email' was either not provided, or invalid");
    missingQuestions.push(questions.email);
  }
  if(!req.validParams.hasOwnProperty('name')){
    warnings.push("required argument 'name' was either not provided, or invalid");
    missingQuestions.push(questions.name);
  }

  console.warn(warnings.join('\n'));

  const answers = await prompt(missingQuestions);
  req.validParams = {
    ...req.validParams,
    ...answers,
  };

  next();
};

const signupWithEmail = async (req, res, next) => {
  console.log('singing up');
  const { email } = req.validParams.email;
  try {
    const { id, timeRemaining } = await signup(email);
    req.signupId = id;
    req.expiryDurationSeconds = (timeRemaining.minutes * 60) + timeRemaining.seconds;
    req.expiryStartTime = new Date();
    console.log(
      `A verification email has been sent to ${email}. It will expire in ${req.expiryDurationSeconds / 60} minutes.`
    );

    next();
    return;
  } catch (err) {
    console.log('Seems like this email has already been verified.');
    const answers = await prompt([
      questions.reEnterEmail,
      {
        ...questions.email,
        type: prev => prev ? questions.email.type : null,
      },
    ]);
    if( answers.reEnterEmail ) {
      req.validParams.email = answers.email;
      signupWithEmail(req, res, next);
      return;
    }
    else {
      console.log("That's ok, we can try again later.");
      next(new Error('Process was cancelled.'));
      return;
    }
  }
};

const verifyWithCode = async (req, res, next) => {
  const { signupId } = req.validParams;

  await prompt({
    ...questions.verificationCode,
    validate: code => isVerificationCodeValid(signupId, code) ? true : "The code you've entered is invalid",
  });

  const password = 'yourNewPasswordDuude';

  console.log(`Here is your master password: "${chalk.red(password)}"`);
  console.log(`${chalk.keyword('orange')('Do not lose this. You cannot reset your master password and will be forced to create a new PGP keypair if you lose it. We recommend using a password manager to avoid losing your master password!')}`);
  
  next();
};


signupRoutine.use(validateParams);
signupRoutine.use(promptMissingParams);
signupRoutine.use(signupWithEmail);
signupRoutine.use(verifyWithCode);

export default (req, res, next) => {
  signupRoutine.run(req, res, next);
};