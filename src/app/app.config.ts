import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs';

export const DISPUTE_STATUS = {
  WAITING: 0,
  APPEALABLE: 1,
  SOLVED: 2,
};
