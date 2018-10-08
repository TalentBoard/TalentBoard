import { Component, OnInit, ViewChild } from '@angular/core';
import { Job } from '../model/Job';
import { Applicant } from '../model/Applicant';
import { ModalTemplate, TemplateModalConfig, SuiModalService } from 'ng2-semantic-ui';
import { JobService } from '../core/job.service';
import { UserService } from '../core/user.service';
import { ApplicantService } from '../core/applicant.service';
import { User } from '../model/User';

export interface IContext {
  title: string;
  job: Job;
}

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.css']
})
export class JobComponent implements OnInit {

  currentUser: User;
  currentJob: Job = new Job();

  jobList: Array<Job> = [];
  applicantList: Array<Applicant> = [];
  applied: Array<Applicant> = [];
  phoneInterview: Array<Applicant> = [];
  personInterview: Array<Applicant> = [];
  declined: Array<Applicant> = [];
  offer: Array<Applicant> = [];
  locations = [
    'Calgary, AB',
    'Halifax, NS',
    'Montreal, QC',
    'Ottawa, ON',
    'Toronto, ON',
    'Vancouver, BC',
  ];

  @ViewChild('jobModal')
  public jobModal: ModalTemplate<IContext, void, void>;
  public newJob: Job = new Job();

  constructor(private modalService: SuiModalService,
    private jobService: JobService,
    private userService: UserService,
    private applicantService: ApplicantService) { }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user'));
    this.fetchUserInfo();
    for (const jobId of this.currentUser.jobIds) {
      this.jobService.getJobById(jobId).subscribe(updatedJob => {
        this.jobList.push(updatedJob);
      });
    }
    this.fetchApplicants();
  }

  fetchApplicants() {
    this.jobService.getJobById(this.currentUser.currentJobView).subscribe(currentJob => {
      this.currentJob = currentJob;
      if (currentJob.applicantIds != null) {
        for (const applicantId of Object.values(currentJob.applicantIds)) {
          this.applicantService.getApplicantById(applicantId).subscribe(currentApplicant => {
            switch (currentApplicant.status) {
              case ('Applied'):
                this.applied.push(currentApplicant);
                break;
              case ('Phone Interview'):
                this.phoneInterview.push(currentApplicant);
                break;
              case ('In Person Interview'):
                this.personInterview.push(currentApplicant);
                break;
              case ('Declined'):
                this.declined.push(currentApplicant);
                break;
              case ('Sent Offer'):
                this.offer.push(currentApplicant);
                break;
            }
            this.applicantList.push(currentApplicant);
          });
        }
      }
    });
  }

  openJobModal(title: string, job: Job) {
    const config = new TemplateModalConfig<IContext, void, void>(this.jobModal);
    config.isClosable = false;
    config.size = 'small';
    config.transition = 'fade up';
    config.transitionDuration = 400;
    config.context = { title: title, job: job };

    this.modalService
      .open(config)
      .onApprove(_ => {
        if (job.id) {
          this.jobService.updateJob(job.id, job);
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          location.reload();
        } else {
          console.log('manz was here');
          this.jobService.addJob(this.newJob);
          this.currentUser.jobIds.push(job.id);
          this.currentUser.currentJobView = job.id;
          this.userService.updateUser(this.currentUser.id, this.currentUser);
          this.newJob = new Job();
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          location.reload();
        }
      })
      .onDeny(_ => { });
  }

  changeCurrentJob(id: string) {
    const job = this.jobList.find((value) => {
      return value.id === id;
    });
    this.currentJob = job;
    this.currentUser.currentJobView = job.id;
    this.userService.updateUser(this.currentUser.id, this.currentUser);
    localStorage.setItem('user', JSON.stringify(this.currentUser));
  }

  getNumberOfJobs() {
    if (this.currentUser.jobIds == null) {
      return 0;
    }
    return this.currentUser.jobIds.length;
  }

  fetchUserInfo() {
    this.userService.getUserById(this.currentUser.id).subscribe(user => {
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser = JSON.parse(localStorage.getItem('user'));
    });
  }
}

